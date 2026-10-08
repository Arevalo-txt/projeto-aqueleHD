"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import api from "../services/api"
import { useToast } from "@chakra-ui/react"

export interface Cliente {
  id: string
  nome: string
  telefone?: string
  historicoPedidos?: number[]
}

export interface Usuario {
  id: string
  nome: string
  email: string
  senha?: string
  role: "admin" | "funcionario"
  permissoes: string[]
  criadoEm: Date
}

export interface Produto {
  id: number
  nome: string
  preco: number
  imagem: string
  categoria: string
  ativo: boolean
  // Ficha técnica: insumos consumidos por unidade vendida (persistida no banco)
  itensEstoque?: Array<{
    itemId: number
    quantidade: number
  }>
  // Campos de personalização por produto
  personalizacaoAtiva?: boolean
  opcoesAdicionais?: { nome: string; preco: number }[]
  opcoesRemover?: string[]
}

export interface ItemPedido {
  produto: Produto
  quantidade: number
  observacao?: string
  adicionais?: { nome: string; preco: number }[]
  removidos?: string[]
}

export interface ItemEstoque {
  id: number
  nome: string
  quantidade: number
  unidade: string
  precoUnitario: number
  categoria: string
  ultimaAtualizacao: Date
  estoqueMinimo: number
}

export interface Pedido {
  id: number
  clienteId?: string
  mesa: string
  cliente: string
  itens: Array<{
    produtoId?: number
    nome: string
    quantidade: number
    preco: number           // Preço unitário total (base + adicionais), calculado no servidor
    precoBase?: number      // Preço base sem adicionais
    observacao?: string
    adicionais?: { nome: string; preco: number }[]
    removidos?: string[]
  }>
  status: "aberto" | "fechado" | "pago"
  formaPagamento?: FormaPagamento
  timestamp: Date
  valorTotal: number
  valorRecebido?: number
  troco?: number
}

export type FormaPagamento = "pix" | "dinheiro" | "cartao_credito" | "cartao_debito"

export interface Venda {
  id: number
  pedidoId: number
  valor: number
  formaPagamento: string
  data: Date
  itensVendidos: Array<{
    nome: string
    quantidade: number
    valorUnitario: number
  }>
}

export interface LogEstoque {
  id?: number
  itemId: number
  itemNome: string
  tipo: "entrada" | "saida" | "ajuste" | "venda"
  quantidade: number
  quantidadeAnterior: number
  quantidadeNova: number
  motivo: string
  usuarioId?: string
  usuarioNome?: string
  dataHora: Date
}

interface DataContextType {
  clientes: Cliente[]
  produtos: Produto[]
  pedidos: Pedido[]
  estoque: ItemEstoque[]
  vendas: Venda[]
  usuarios: Usuario[]
  currentUser: Usuario | null
  loading: boolean
  error: string | null
  addCliente: (cliente: Omit<Cliente, "id">) => Promise<Cliente>
  updateCliente: (cliente: Cliente) => Promise<void>
  getCliente: (id: string) => Promise<Cliente | undefined>
  getClienteByNome: (nome: string) => Cliente | undefined
  addProduto: (produto: Omit<Produto, "id">) => Promise<Produto>
  updateProduto: (produto: Produto) => Promise<void>
  deleteProduto: (id: number) => Promise<void>
  addPedido: (pedido: Omit<Pedido, "id">) => Promise<Pedido>
  updatePedido: (pedido: Pedido) => Promise<void>
  deletePedido: (id: number) => Promise<void>
  getPedido: (id: number) => Pedido | undefined
  pagarPedido: (id: number, formaPagamento: FormaPagamento, valorRecebido?: number) => Promise<Pedido>
  addItemEstoque: (item: Omit<ItemEstoque, "id">) => Promise<ItemEstoque>
  updateItemEstoque: (item: ItemEstoque) => Promise<void>
  deleteItemEstoque: (id: number) => Promise<void>
  refreshData: () => Promise<void>
  registrarLogEstoque: (log: Omit<LogEstoque, "id">) => Promise<void>
  associarItemEstoqueProduto: (produtoId: number, itemId: number, quantidade: number) => Promise<Produto>
  desassociarItemEstoqueProduto: (produtoId: number, itemId: number) => Promise<Produto>
  atualizarQuantidadeItemEstoqueProduto: (produtoId: number, itemId: number, quantidade: number) => Promise<Produto>
  getItensEstoqueProduto: (produtoId: number) => Array<{ itemId: number; quantidade: number }>
  getItensEstoqueDisponiveis: () => ItemEstoque[]
  getProdutoComItensEstoque: (produtoId: number) => Produto | undefined
  login: (email: string, senha?: string) => Promise<boolean>
  logout: () => void
  addUsuario: (usuario: Omit<Usuario, "id" | "criadoEm">) => Promise<Usuario>
  updateUsuario: (usuario: Usuario) => Promise<void>
  deleteUsuario: (id: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

// Chaves que versões antigas usavam como "backup" local dos dados. Hoje o banco é a
// única fonte da verdade; elas são apagadas para não exibir dados desatualizados.
const CHAVES_LEGADAS = ["clientes", "produtos", "pedidos", "estoque", "vendas", "usuarios"]
// Fichas técnicas que versões antigas guardavam só no navegador (migradas uma única vez).
const CHAVE_FICHAS_LOCAIS = "produtoEstoqueRelacoes"

export const mensagemErro = (err: any) => err?.response?.data?.message || err?.message || "Erro inesperado"

const formatarPedido = (p: any): Pedido => ({ ...p, timestamp: new Date(p.timestamp) })
const formatarItemEstoque = (e: any): ItemEstoque => ({ ...e, ultimaAtualizacao: new Date(e.ultimaAtualizacao) })
const formatarVenda = (v: any): Venda => ({ ...v, data: new Date(v.data) })
const formatarUsuario = (u: any): Usuario => ({ ...u, criadoEm: new Date(u.criadoEm) })

const substituirPorId = <T extends { id: number | string }>(lista: T[], novos: T[]) => {
  const porId = new Map(novos.map((n) => [n.id, n]))
  const atualizada = lista.map((item) => porId.get(item.id) ?? item)
  const novosItens = novos.filter((n) => !lista.some((item) => item.id === n.id))
  return [...atualizada, ...novosItens]
}

const temPermissao = (usuario: Usuario | null, permissao: string) =>
  !!usuario && (usuario.role === "admin" || usuario.permissoes.includes(permissao))

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [estoque, setEstoque] = useState<ItemEstoque[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    try {
      const stored = localStorage.getItem("currentUser")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const toast = useToast()

  // Mostra o erro da API ao usuário e repassa a exceção para quem chamou:
  // nenhuma tela deve exibir "sucesso" se o servidor não confirmou a operação.
  const falhar = (titulo: string, err: unknown): never => {
    toast({ title: titulo, description: mensagemErro(err), status: "error", duration: 5000, isClosable: true })
    throw err
  }

  // GET que trata 403 (usuário sem permissão para aquele recurso) como lista vazia.
  const carregar = async (rota: string): Promise<any[]> => {
    try {
      return (await api.get(rota)).data
    } catch (err: any) {
      if (err.response?.status === 403) return []
      throw err
    }
  }

  // Envia para o banco as fichas técnicas que só existiam no localStorage do navegador
  // (bug antigo: editar o produto apagava a ficha no servidor). Só preenche produtos
  // cuja ficha no banco está vazia, e só roda para quem pode editar produtos.
  const migrarFichasLocais = async (usuario: Usuario | null, produtosApi: Produto[], estoqueApi: ItemEstoque[]) => {
    const salvas = localStorage.getItem(CHAVE_FICHAS_LOCAIS)
    if (!salvas || !temPermissao(usuario, "produtos")) return produtosApi

    let relacoes: Array<{ produtoId: number; itemId: number; quantidade: number }> = []
    try {
      relacoes = JSON.parse(salvas)
    } catch {
      localStorage.removeItem(CHAVE_FICHAS_LOCAIS)
      return produtosApi
    }

    const idsEstoque = new Set(estoqueApi.map((e) => e.id))
    const resultado = [...produtosApi]
    let migrados = 0
    for (const [indice, produto] of produtosApi.entries()) {
      if ((produto.itensEstoque || []).length > 0) continue
      const ficha = relacoes
        .filter((r) => r.produtoId === produto.id && idsEstoque.has(r.itemId) && r.quantidade > 0)
        .map((r) => ({ itemId: r.itemId, quantidade: r.quantidade }))
      if (ficha.length === 0) continue
      try {
        resultado[indice] = (await api.put(`/produtos/${produto.id}`, { itensEstoque: ficha })).data
        migrados++
      } catch (err) {
        console.error(`Falha ao migrar ficha técnica do produto ${produto.id}:`, err)
        return resultado // mantém a chave para tentar novamente no próximo carregamento
      }
    }

    localStorage.removeItem(CHAVE_FICHAS_LOCAIS)
    if (migrados > 0) {
      toast({
        title: "Fichas técnicas sincronizadas",
        description: `${migrados} ficha(s) técnica(s) salvas apenas neste navegador foram enviadas ao servidor.`,
        status: "info",
        duration: 6000,
        isClosable: true,
      })
    }
    return resultado
  }

  // Carrega todos os dados da API. Cada recurso é carregado de forma independente,
  // de modo que a falta de permissão para um deles não impede os demais.
  const refreshData = async () => {
    setLoading(true)
    setError(null)

    try {
      const usuarioAtual = formatarUsuario((await api.get("/usuarios/me")).data)
      setCurrentUser(usuarioAtual)
      localStorage.setItem("currentUser", JSON.stringify(usuarioAtual))

      const [clientesApi, produtosApi, pedidosApi, estoqueApi, vendasApi, usuariosApi] = await Promise.all([
        carregar("/clientes"),
        carregar("/produtos"),
        carregar("/pedidos"),
        carregar("/estoque"),
        carregar("/vendas"),
        carregar("/usuarios"),
      ])

      const estoqueFormatado = estoqueApi.map(formatarItemEstoque)
      setClientes(clientesApi)
      setProdutos(await migrarFichasLocais(usuarioAtual, produtosApi, estoqueFormatado))
      setPedidos(pedidosApi.map(formatarPedido))
      setEstoque(estoqueFormatado)
      setVendas(vendasApi.map(formatarVenda))
      setUsuarios(usuariosApi.map(formatarUsuario))
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err)
      // 401 é tratado pelo interceptor (redireciona pro login), não mostrar overlay de erro
      if (err.response?.status !== 401) {
        setError(mensagemErro(err))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    CHAVES_LEGADAS.forEach((chave) => localStorage.removeItem(chave))

    const token = localStorage.getItem("authToken")
    if (token && token !== "undefined") {
      refreshData()
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!currentUser || !token || token === "undefined") return

    const socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:3000", {
      auth: { token },
      reconnectionAttempts: 3,
      reconnectionDelay: 3000,
      timeout: 5000,
    })
    socketRef.current = socket

    socket.on("connect_error", () => {
      // socket indisponível ou token recusado — a tela continua funcionando sem tempo real
    })

    socket.on("pedido:novo", (novoPedido: any) => {
      setPedidos((prev) => substituirPorId(prev, [formatarPedido(novoPedido)]))
    })

    socket.on("pedido:atualizado", (pedidoAtualizado: any) => {
      setPedidos((prev) => substituirPorId(prev, [formatarPedido(pedidoAtualizado)]))
    })

    socket.on("pedido:removido", ({ id }: { id: number }) => {
      setPedidos((prev) => prev.filter((p) => p.id !== id))
    })

    socket.on("estoque:atualizado", (itens: any[]) => {
      setEstoque((prev) => substituirPorId(prev, itens.map(formatarItemEstoque)))
    })

    return () => {
      socket.disconnect()
    }
  }, [currentUser?.id])

  // Clientes
  const addCliente = async (cliente: Omit<Cliente, "id">) => {
    try {
      const novoCliente: Cliente = (await api.post("/clientes", cliente)).data
      setClientes((prev) => [...prev, novoCliente])
      return novoCliente
    } catch (err) {
      return falhar("Erro ao cadastrar cliente", err)
    }
  }

  const updateCliente = async (cliente: Cliente) => {
    try {
      const atualizado: Cliente = (await api.put(`/clientes/${cliente.id}`, cliente)).data
      setClientes((prev) => prev.map((c) => (c.id === cliente.id ? atualizado : c)))
    } catch (err) {
      falhar("Erro ao atualizar cliente", err)
    }
  }

  const getCliente = async (id: string) => {
    try {
      return (await api.get(`/clientes/${id}`)).data
    } catch (err) {
      console.error("Erro ao buscar cliente:", err)
      return clientes.find((c) => c.id === id)
    }
  }

  const getClienteByNome = (nome: string) => {
    return clientes.find((c) => c.nome.toLowerCase() === nome.toLowerCase())
  }

  // Produtos (a ficha técnica — itensEstoque — é salva junto, no banco)
  const addProduto = async (produto: Omit<Produto, "id">) => {
    try {
      const novoProduto: Produto = (await api.post("/produtos", produto)).data
      setProdutos((prev) => [...prev, novoProduto])
      return novoProduto
    } catch (err) {
      return falhar("Erro ao cadastrar produto", err)
    }
  }

  const updateProduto = async (produto: Produto) => {
    try {
      const atualizado: Produto = (await api.put(`/produtos/${produto.id}`, produto)).data
      setProdutos((prev) => prev.map((p) => (p.id === produto.id ? atualizado : p)))
    } catch (err) {
      falhar("Erro ao atualizar produto", err)
    }
  }

  const deleteProduto = async (id: number) => {
    try {
      await api.delete(`/produtos/${id}`)
      setProdutos((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      falhar("Erro ao excluir produto", err)
    }
  }

  // Pedidos (preços e total são calculados pelo servidor a partir do cardápio)
  const addPedido = async (pedido: Omit<Pedido, "id">) => {
    try {
      const novoPedido = formatarPedido((await api.post("/pedidos", pedido)).data)
      setPedidos((prev) => substituirPorId(prev, [novoPedido]))

      if (pedido.clienteId) {
        const cliente = clientes.find((c) => c.id === pedido.clienteId)
        if (cliente) {
          updateCliente({ ...cliente, historicoPedidos: [...(cliente.historicoPedidos || []), novoPedido.id] }).catch(() => {})
        }
      }

      return novoPedido
    } catch (err) {
      return falhar("Erro ao criar comanda", err)
    }
  }

  const updatePedido = async (pedido: Pedido) => {
    try {
      const atualizado = formatarPedido((await api.put(`/pedidos/${pedido.id}`, pedido)).data)
      setPedidos((prev) => substituirPorId(prev, [atualizado]))
    } catch (err) {
      falhar("Erro ao atualizar comanda", err)
    }
  }

  const deletePedido = async (id: number) => {
    try {
      await api.delete(`/pedidos/${id}`)
      setPedidos((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      falhar("Erro ao excluir comanda", err)
    }
  }

  const getPedido = (id: number) => {
    return pedidos.find((p) => p.id === id)
  }

  // Fechamento da comanda: o servidor calcula total e troco, registra a venda e
  // baixa o estoque pela ficha técnica numa única transação.
  const pagarPedido = async (id: number, formaPagamento: FormaPagamento, valorRecebido?: number) => {
    try {
      const { pedido, venda, estoqueAtualizado, alertas } = (
        await api.post(`/pedidos/${id}/pagar`, { formaPagamento, valorRecebido })
      ).data
      const pedidoPago = formatarPedido(pedido)
      setPedidos((prev) => substituirPorId(prev, [pedidoPago]))
      setVendas((prev) => substituirPorId(prev, [formatarVenda(venda)]))
      setEstoque((prev) => substituirPorId(prev, estoqueAtualizado.map(formatarItemEstoque)))

      for (const alerta of alertas as { nome: string; estoqueMinimo: number }[]) {
        toast({
          title: "Alerta de Estoque",
          description: `O item "${alerta.nome}" está abaixo do nível mínimo (${alerta.estoqueMinimo})`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        })
      }
      return pedidoPago
    } catch (err) {
      return falhar("Erro ao registrar pagamento", err)
    }
  }

  // Estoque
  const addItemEstoque = async (item: Omit<ItemEstoque, "id">) => {
    try {
      const novoItem = formatarItemEstoque((await api.post("/estoque", item)).data)
      setEstoque((prev) => substituirPorId(prev, [novoItem]))
      return novoItem
    } catch (err) {
      return falhar("Erro ao adicionar item ao estoque", err)
    }
  }

  const updateItemEstoque = async (item: ItemEstoque) => {
    try {
      const atualizado = formatarItemEstoque((await api.put(`/estoque/${item.id}`, item)).data)
      setEstoque((prev) => substituirPorId(prev, [atualizado]))
    } catch (err) {
      falhar("Erro ao atualizar item do estoque", err)
    }
  }

  const deleteItemEstoque = async (id: number) => {
    try {
      await api.delete(`/estoque/${id}`)
      setEstoque((prev) => prev.filter((e) => e.id !== id))
      // O servidor também remove o insumo das fichas técnicas
      setProdutos((prev) =>
        prev.map((p) => ({ ...p, itensEstoque: (p.itensEstoque || []).filter((i) => i.itemId !== id) })),
      )
    } catch (err) {
      falhar("Erro ao excluir item do estoque", err)
    }
  }

  // Ficha técnica (relação produto → insumos)
  const salvarFichaTecnica = async (produtoId: number, itensEstoque: Array<{ itemId: number; quantidade: number }>) => {
    let atualizado: Produto
    try {
      atualizado = (await api.put(`/produtos/${produtoId}`, { itensEstoque })).data
    } catch (err) {
      // As telas exibem err.message; usa a mensagem enviada pelo servidor
      throw new Error(mensagemErro(err))
    }
    setProdutos((prev) => prev.map((p) => (p.id === produtoId ? atualizado : p)))
    return atualizado
  }

  const fichaDoProduto = (produtoId: number) => {
    const produto = produtos.find((p) => p.id === produtoId)
    if (!produto) throw new Error("Produto não encontrado")
    return (produto.itensEstoque || []).map(({ itemId, quantidade }) => ({ itemId, quantidade }))
  }

  const associarItemEstoqueProduto = async (produtoId: number, itemId: number, quantidade: number) => {
    const ficha = fichaDoProduto(produtoId)
    if (!estoque.some((item) => item.id === itemId)) throw new Error("Item de estoque não encontrado")
    if (ficha.some((item) => item.itemId === itemId)) throw new Error("Este item já está associado a este produto")
    return salvarFichaTecnica(produtoId, [...ficha, { itemId, quantidade }])
  }

  const desassociarItemEstoqueProduto = async (produtoId: number, itemId: number) => {
    const ficha = fichaDoProduto(produtoId)
    if (!ficha.some((item) => item.itemId === itemId)) throw new Error("Este item não está associado a este produto")
    return salvarFichaTecnica(produtoId, ficha.filter((item) => item.itemId !== itemId))
  }

  const atualizarQuantidadeItemEstoqueProduto = async (produtoId: number, itemId: number, quantidade: number) => {
    const ficha = fichaDoProduto(produtoId)
    if (!ficha.some((item) => item.itemId === itemId)) throw new Error("Este item não está associado a este produto")
    return salvarFichaTecnica(
      produtoId,
      ficha.map((item) => (item.itemId === itemId ? { ...item, quantidade } : item)),
    )
  }

  const getItensEstoqueProduto = (produtoId: number) => {
    return produtos.find((p) => p.id === produtoId)?.itensEstoque || []
  }

  const getItensEstoqueDisponiveis = () => {
    return estoque
  }

  const getProdutoComItensEstoque = (produtoId: number) => {
    return produtos.find((p) => p.id === produtoId)
  }

  const registrarLogEstoque = async (log: Omit<LogEstoque, "id">) => {
    try {
      await api.post("/logs-estoque", log)
    } catch {
      // log de auditoria é best-effort; não bloqueia o fluxo principal
    }
  }

  // --- Autenticação e gestão de usuários ---
  const login = async (email: string, senha?: string) => {
    try {
      const { token, user } = (await api.post("/usuarios/login", { email, senha })).data
      localStorage.setItem("authToken", token)
      localStorage.setItem("currentUser", JSON.stringify(user))
      setCurrentUser(user)
      await refreshData()
      return true
    } catch (err) {
      console.error("Falha ao logar:", err)
      return false
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("authToken")
    localStorage.removeItem("currentUser")
    socketRef.current?.disconnect()
    socketRef.current = null
  }

  const addUsuario = async (usuario: Omit<Usuario, "id" | "criadoEm">) => {
    try {
      const novoUsuario = formatarUsuario((await api.post("/usuarios", usuario)).data)
      setUsuarios((prev) => [...prev, novoUsuario])
      return novoUsuario
    } catch (err) {
      return falhar("Erro ao cadastrar funcionário", err)
    }
  }

  const updateUsuario = async (usuario: Usuario) => {
    try {
      const atualizado = formatarUsuario((await api.put(`/usuarios/${usuario.id}`, usuario)).data)
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? atualizado : u)))
      if (currentUser?.id === usuario.id) {
        setCurrentUser(atualizado)
        localStorage.setItem("currentUser", JSON.stringify(atualizado))
      }
    } catch (err) {
      falhar("Erro ao atualizar funcionário", err)
    }
  }

  const deleteUsuario = async (id: string) => {
    try {
      await api.delete(`/usuarios/${id}`)
      setUsuarios((prev) => prev.filter((u) => u.id !== id))
      if (currentUser?.id === id) {
        logout()
      }
    } catch (err) {
      falhar("Erro ao remover funcionário", err)
    }
  }

  const value = {
    clientes,
    produtos,
    pedidos,
    estoque,
    vendas,
    usuarios,
    currentUser,
    loading,
    error,
    addCliente,
    updateCliente,
    getCliente,
    getClienteByNome,
    addProduto,
    updateProduto,
    deleteProduto,
    addPedido,
    updatePedido,
    deletePedido,
    getPedido,
    pagarPedido,
    addItemEstoque,
    updateItemEstoque,
    deleteItemEstoque,
    refreshData,
    registrarLogEstoque,
    associarItemEstoqueProduto,
    desassociarItemEstoqueProduto,
    atualizarQuantidadeItemEstoqueProduto,
    getItensEstoqueProduto,
    getItensEstoqueDisponiveis,
    getProdutoComItensEstoque,
    login,
    logout,
    addUsuario,
    updateUsuario,
    deleteUsuario,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
