"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Image,
  Badge,
  IconButton,
  useToast,
  Input,
  Select,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  VStack,
  Divider,
  HStack,
  Collapse,
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { FiEdit2, FiPlusCircle, FiTrash2, FiSearch, FiRefreshCw, FiPackage } from "react-icons/fi"
import { useData, type Produto } from "../context/DataContext"

const MotionGridItem = motion(GridItem)

const ProdutosPage = () => {
  const {
    produtos,
    addProduto,
    updateProduto,
    deleteProduto,
    estoque,
    refreshData,
    associarItemEstoqueProduto,
    desassociarItemEstoqueProduto,
    atualizarQuantidadeItemEstoqueProduto,
    getProdutoComItensEstoque,
  } = useData()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isOpenEstoque, onOpen: onOpenEstoque, onClose: onCloseEstoque } = useDisclosure()

  const [formData, setFormData] = useState<Omit<Produto, "id">>({
    nome: "",
    preco: 0,
    imagem: "/placeholder.svg?height=100&width=100",
    categoria: "",
    ativo: true,
    personalizacaoAtiva: false,
    opcoesAdicionais: [],
    opcoesRemover: [],
  })

  const [editId, setEditId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas")
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [itemEstoqueSelecionado, setItemEstoqueSelecionado] = useState<number | null>(null)
  const [quantidadeItem, setQuantidadeItem] = useState<number>(1)
  const [filtroEstoque, setFiltroEstoque] = useState("")

  const [filtroAdicional, setFiltroAdicional] = useState("")
  const [showSugestoesAdicional, setShowSugestoesAdicional] = useState(false)
  const [itensEstoqueDoProdutoEditado, setItensEstoqueDoProdutoEditado] = useState<Array<{itemId: number, quantidade: number}>>([])

  const initialRef = useRef<HTMLInputElement>(null)

  const categorias = ["todas", ...new Set(produtos.map((p) => p.categoria))]

  const filteredProdutos = produtos.filter((produto) => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria = categoriaFiltro === "todas" || produto.categoria === categoriaFiltro
    return matchesSearch && matchesCategoria
  })

  const filteredEstoque = estoque.filter((item) => item.nome.toLowerCase().includes(filtroEstoque.toLowerCase()))

  useEffect(() => {
    if (produtoSelecionado) {
      const produtoAtualizado = getProdutoComItensEstoque(produtoSelecionado.id)
      if (produtoAtualizado) {
        setProdutoSelecionado(produtoAtualizado)
      }
    }
  }, [produtos, getProdutoComItensEstoque, produtoSelecionado])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, ativo: e.target.checked }))
  }

  const handleNumberChange = (value: string) => {
    setFormData((prev) => ({ ...prev, preco: Number.parseFloat(value) || 0 }))
  }

  const resetForm = () => {
    setFormData({
      nome: "",
      preco: 0,
      imagem: "/placeholder.svg?height=100&width=100",
      categoria: "",
      ativo: true,
      personalizacaoAtiva: false,
      opcoesAdicionais: [],
      opcoesRemover: [],
    })
    setEditId(null)
    setFiltroAdicional("")
    setShowSugestoesAdicional(false)
    setItensEstoqueDoProdutoEditado([])
  }

  const handleAdicionarOpcaoAdicional = (nomeItem: string, precoItem: number = 0) => {
    const nome = nomeItem.trim()
    if (!nome) return
    // Evitar duplicatas
    if ((formData.opcoesAdicionais || []).some(a => a.nome === nome)) return
    setFormData((prev) => ({
      ...prev,
      opcoesAdicionais: [...(prev.opcoesAdicionais || []), { nome, preco: precoItem }],
    }))
    setFiltroAdicional("")
    setShowSugestoesAdicional(false)
  }

  const handleAtualizarPrecoAdicional = (index: number, novoPreco: number) => {
    setFormData((prev) => ({
      ...prev,
      opcoesAdicionais: (prev.opcoesAdicionais || []).map((a, i) => i === index ? { ...a, preco: novoPreco } : a),
    }))
  }

  const handleRemoverOpcaoAdicional = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      opcoesAdicionais: (prev.opcoesAdicionais || []).filter((_, i) => i !== index),
    }))
  }

  const handleToggleRemover = (nomeItem: string) => {
    const jaExiste = (formData.opcoesRemover || []).includes(nomeItem)
    setFormData((prev) => ({
      ...prev,
      opcoesRemover: jaExiste
        ? (prev.opcoesRemover || []).filter(r => r !== nomeItem)
        : [...(prev.opcoesRemover || []), nomeItem],
    }))
  }

  const handleSubmit = async () => {
    if (!formData.nome || !formData.categoria || formData.preco <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente.",
        status: "error",
        duration: 3000,
      })
      return
    }

    try {
      if (editId !== null) {
        await updateProduto({ ...formData, id: editId })
      } else {
        await addProduto(formData)
      }
    } catch {
      return
    }

    if (editId !== null) {
      toast({
        title: "Produto atualizado",
        description: `${formData.nome} atualizado com sucesso.`,
        status: "success",
        duration: 3000,
      })
    } else {
      toast({
        title: "Produto adicionado",
        description: `${formData.nome} adicionado com sucesso.`,
        status: "success",
        duration: 3000,
      })
    }
    resetForm()
    onClose()
  }

  const handleEdit = (produto: Produto) => {
    const produtoComItens = getProdutoComItensEstoque(produto.id)
    setItensEstoqueDoProdutoEditado(produtoComItens?.itensEstoque || [])
    setFormData({
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      categoria: produto.categoria,
      ativo: produto.ativo,
      personalizacaoAtiva: produto.personalizacaoAtiva || false,
      opcoesAdicionais: produto.opcoesAdicionais || [],
      opcoesRemover: produto.opcoesRemover || [],
    })
    setFiltroAdicional("")
    setShowSugestoesAdicional(false)
    setEditId(produto.id)
    onOpen()
  }

  const handleDelete = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
      try {
        await deleteProduto(id)
      } catch {
        return
      }
      toast({
        title: "Produto excluído",
        description: `${nome} foi removido.`,
        status: "error",
        duration: 3000,
      })
    }
  }

  const handleOpenEstoqueModal = (produto: Produto) => {
    const produtoCompleto = getProdutoComItensEstoque(produto.id)
    setProdutoSelecionado(produtoCompleto || produto)
    setItemEstoqueSelecionado(null)
    setQuantidadeItem(1)
    setFiltroEstoque("")
    onOpenEstoque()
  }

  const handleAssociarItemEstoque = async () => {
    if (!itemEstoqueSelecionado || !produtoSelecionado) return
    try {
      const produtoAtualizado = await associarItemEstoqueProduto(
        produtoSelecionado.id,
        itemEstoqueSelecionado,
        quantidadeItem,
      )
      toast({
        title: "Item associado",
        description: `Item de estoque associado ao produto ${produtoSelecionado.nome}.`,
        status: "success",
        duration: 3000,
      })
      setItemEstoqueSelecionado(null)
      setQuantidadeItem(1)
      setProdutoSelecionado(produtoAtualizado)
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível associar o item.",
        status: "error",
        duration: 3000,
      })
    }
  }

  const handleDesassociarItemEstoque = async (itemId: number) => {
    if (!produtoSelecionado) return
    try {
      const produtoAtualizado = await desassociarItemEstoqueProduto(produtoSelecionado.id, itemId)
      toast({
        title: "Item desassociado",
        description: "Item de estoque desassociado do produto.",
        status: "success",
        duration: 3000,
      })
      setProdutoSelecionado(produtoAtualizado)
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível desassociar.",
        status: "error",
        duration: 3000,
      })
    }
  }

  const handleAtualizarQuantidade = async (itemId: number, quantidade: number) => {
    if (!produtoSelecionado) return
    try {
      const produtoAtualizado = await atualizarQuantidadeItemEstoqueProduto(produtoSelecionado.id, itemId, quantidade)
      toast({
        title: "Quantidade atualizada",
        description: "Quantidade do item atualizada.",
        status: "success",
        duration: 1500,
      })
      setProdutoSelecionado(produtoAtualizado)
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível atualizar.",
        status: "error",
        duration: 3000,
      })
    }
  }

  const verificarRelacaoEstoqueProduto = (produtoId: number) => {
    const produto = getProdutoComItensEstoque(produtoId)
    if (!produto || !produto.itensEstoque || produto.itensEstoque.length === 0) {
      toast({
        title: "Sem relação",
        description: "Este produto não possui itens de estoque associados.",
        status: "warning",
        duration: 3000,
      })
      return
    }
    const itensInfo = produto.itensEstoque
      .map((associacao) => {
        const item = estoque.find((i) => i.id === associacao.itemId)
        return item ? `${item.nome} (${associacao.quantidade})` : `Item #${associacao.itemId}`
      })
      .join(", ")
    toast({
      title: "Relação encontrada",
      description: `O produto possui ${produto.itensEstoque.length} itens de estoque: ${itensInfo}`,
      status: "success",
      duration: 5000,
    })
  }

  return (
    <Box maxW="1400px" mx="auto" w="100%">
      <Flex justify="space-between" align="center" mb={10} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" color="brand.light" fontWeight="700">
            Cardápio / Produtos
          </Heading>
          <Text color="gray.400" mt={1}>Gerencie os produtos à venda no sistema.</Text>
        </Box>
        <Flex gap={3}>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={refreshData}
            variant="outline"
            color="brand.light"
            borderColor="brand.surfaceborder"
            _hover={{ bg: "whiteAlpha.100" }}
            borderRadius="full"
          >
            Sincronizar
          </Button>
          <Button
            leftIcon={<FiPlusCircle />}
            onClick={() => {
              resetForm()
              onOpen()
            }}
            variant="primary"
            borderRadius="full"
            px={8}
            boxShadow="0 4px 15px rgba(255,107,0,0.4)"
          >
            Novo Produto
          </Button>
        </Flex>
      </Flex>

      <Flex mb={8} gap={4} direction={{ base: "column", md: "row" }} bg="brand.surface" p={4} borderRadius="2xl" border="1px solid" borderColor="brand.surfaceborder" backdropFilter="blur(16px)">
        <InputGroup maxW={{ base: "100%", md: "400px" }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Buscar produto..."
            bg="whiteAlpha.50"
            color="brand.light"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            border="1px solid"
            borderColor="brand.surfaceborder"
            borderRadius="full"
            _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px #FF6B00" }}
          />
          {searchTerm && (
            <InputRightElement>
              <IconButton
                aria-label="Limpar"
                icon={<FiRefreshCw />}
                size="sm"
                variant="ghost"
                color="brand.secondary"
                onClick={() => setSearchTerm("")}
                isRound
              />
            </InputRightElement>
          )}
        </InputGroup>

        <Select
          maxW={{ base: "100%", md: "250px" }}
          bg="whiteAlpha.50"
          color="brand.light"
          border="1px solid"
          borderColor="brand.surfaceborder"
          borderRadius="full"
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          sx={{"& > option":{background:"#0F172A",color:"white"}}}
        >
          {categorias.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria === "todas" ? "Todas as categorias" : categoria}
            </option>
          ))}
        </Select>
      </Flex>

      <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }} gap={6}>
        {filteredProdutos.map((produto, index) => {
          const produtoCompleto = getProdutoComItensEstoque(produto.id)
          const itensEstoque = produtoCompleto?.itensEstoque || []

          return (
            <MotionGridItem 
              key={produto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}
            >
              <Box variant="glass" borderRadius="2xl" overflow="hidden" h="100%" display="flex" flexDirection="column">
                <Box position="relative">
                  <Image
                    src={produto.imagem || "/placeholder.svg?height=100&width=100"}
                    alt={produto.nome}
                    w="100%"
                    h="180px"
                    objectFit="cover"
                  />
                  <Badge 
                    position="absolute" 
                    top={3} 
                    right={3} 
                    colorScheme={produto.ativo ? "green" : "red"}
                    px={3} py={1} borderRadius="full" variant="solid"
                  >
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  {produto.personalizacaoAtiva && (
                    <Badge
                      position="absolute"
                      top={3}
                      left={3}
                      colorScheme="orange"
                      px={2} py={1} borderRadius="full" variant="solid"
                      fontSize="xs"
                    >
                      ✦ Personalizável
                    </Badge>
                  )}
                </Box>
                <Box p={5} flex="1" display="flex" flexDirection="column">
                  <Flex justify="space-between" align="start" mb={2}>
                    <Heading size="md" color="brand.light" lineHeight="1.2">
                      {produto.nome}
                    </Heading>
                  </Flex>

                  <Text color="brand.secondary" fontSize="xl" fontWeight="bold" mb={1}>
                    R$ {produto.preco.toFixed(2)}
                  </Text>

                  <Text color="gray.400" fontSize="sm" mb={4}>
                    {produto.categoria}
                  </Text>

                  {/* Exibir itens de estoque relacionados */}
                  {itensEstoque.length > 0 ? (
                    <Box bg="whiteAlpha.50" p={3} borderRadius="lg" mb={4} border="1px dashed" borderColor="brand.surfaceborder">
                      <Flex align="center" gap={2} mb={2}>
                        <FiPackage color="#FFD700" size={14} />
                        <Text color="brand.secondary" fontSize="xs" fontWeight="bold">EM RECEITA:</Text>
                      </Flex>
                      <VStack align="stretch" spacing={1}>
                        {itensEstoque.slice(0, 3).map((associacao) => {
                          const item = estoque.find((i) => i.id === associacao.itemId)
                          return item ? (
                            <Flex key={associacao.itemId} justify="space-between">
                              <Text color="gray.300" fontSize="xs" noOfLines={1}>{item.nome}</Text>
                              <Text color="gray.500" fontSize="xs">{associacao.quantidade}x</Text>
                            </Flex>
                          ) : null
                        })}
                        {itensEstoque.length > 3 && (
                          <Text color="brand.primary" fontSize="xs" textAlign="center" mt={1}>+ {itensEstoque.length - 3} itens</Text>
                        )}
                      </VStack>
                    </Box>
                  ) : (
                    <Box bg="whiteAlpha.50" p={3} borderRadius="lg" mb={4} border="1px dashed" borderColor="whiteAlpha.100">
                      <Text color="gray.500" fontSize="xs" textAlign="center">Sem receita (Padrão)</Text>
                    </Box>
                  )}

                  <Flex gap={2} mt="auto">
                    <Button leftIcon={<FiPackage />} onClick={() => handleOpenEstoqueModal(produto)} size="sm" variant="outline" color="brand.secondary" borderColor="brand.surfaceborder" _hover={{ bg: "whiteAlpha.100" }} flex="1">
                      Receita
                    </Button>
                    <IconButton aria-label="Editar" icon={<FiEdit2 />} onClick={() => handleEdit(produto)} size="sm" variant="ghost" color="brand.light" _hover={{ bg: "whiteAlpha.200" }} />
                    <IconButton aria-label="Excluir" icon={<FiTrash2 />} onClick={() => handleDelete(produto.id, produto.nome)} size="sm" variant="ghost" color="red.400" _hover={{ bg: "red.800", color: "white" }} />
                  </Flex>
                </Box>
              </Box>
            </MotionGridItem>
          )
        })}
      </Grid>
      
      {filteredProdutos.length === 0 && (
        <Flex direction="column" align="center" justify="center" py={20}>
          <Text color="gray.500" fontSize="lg">Nenhum produto encontrado na busca.</Text>
        </Flex>
      )}

      {/* Modal Criar/Editar Produto */}
      <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialRef as any} size="lg" isCentered motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent bg="brand.surface" borderColor="brand.surfaceborder" borderWidth={1} borderRadius="2xl">
          <ModalHeader color="brand.light">{editId !== null ? "Editar Produto" : "Novo Produto"}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            <FormControl mb={4} isRequired>
              <FormLabel color="gray.400" fontSize="sm">Nome do Produto</FormLabel>
              <Input
                ref={initialRef}
                placeholder="Ex: Hot Dog Especial"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                bg="whiteAlpha.100"
                color="brand.light"
                border="1px solid"
                borderColor="brand.surfaceborder"
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel color="gray.400" fontSize="sm">Categoria</FormLabel>
              <Input
                placeholder="Ex: Lanches, Bebidas"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                bg="whiteAlpha.100"
                color="brand.light"
                border="1px solid"
                borderColor="brand.surfaceborder"
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel color="gray.400" fontSize="sm">Preço (R$)</FormLabel>
              <NumberInput min={0} step={0.5} precision={2} value={formData.preco} onChange={handleNumberChange}>
                <NumberInputField bg="whiteAlpha.100" color="brand.light" borderColor="brand.surfaceborder" />
                <NumberInputStepper>
                  <NumberIncrementStepper color="brand.secondary" />
                  <NumberDecrementStepper color="brand.secondary" />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel color="gray.400" fontSize="sm">URL da Imagem</FormLabel>
              <Input
                placeholder="https://..."
                name="imagem"
                value={formData.imagem}
                onChange={handleChange}
                bg="whiteAlpha.100"
                color="brand.light"
                border="1px solid"
                borderColor="brand.surfaceborder"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center" mb={4}>
              <FormLabel htmlFor="ativo" mb="0" color="brand.light" fontWeight="bold">
                Produto Ativo
              </FormLabel>
              <Switch id="ativo" isChecked={formData.ativo} onChange={handleSwitchChange} colorScheme="orange" ml={4} />
            </FormControl>

            {/* Seção de Personalização */}
            <Divider borderColor="whiteAlpha.200" mb={4} />
            <FormControl display="flex" alignItems="center" mb={2}>
              <FormLabel htmlFor="personalizacao" mb="0" color="brand.light" fontWeight="bold">
                Habilitar Personalização na Comanda
              </FormLabel>
              <Switch
                id="personalizacao"
                isChecked={formData.personalizacaoAtiva || false}
                onChange={(e) => setFormData((prev) => ({ ...prev, personalizacaoAtiva: e.target.checked }))}
                colorScheme="orange"
                ml={4}
              />
            </FormControl>
            <Text color="gray.500" fontSize="xs" mb={4}>
              Quando ativo, ao adicionar este item na comanda será exibido um modal para personalizar o pedido.
            </Text>

            <Collapse in={formData.personalizacaoAtiva || false} animateOpacity>
              <VStack align="stretch" spacing={5} bg="whiteAlpha.50" p={4} borderRadius="xl" border="1px dashed" borderColor="brand.primary">
                
                {/* Adicionais via Estoque */}
                <Box>
                  <Text color="brand.secondary" fontWeight="bold" fontSize="sm" mb={1}>
                    Opções de Adicionais (Extras)
                  </Text>
                  <Text color="gray.500" fontSize="xs" mb={3}>
                    Selecione itens do estoque que podem ser adicionados neste produto.
                  </Text>

                  {/* Lista de adicionais já adicionados */}
                  {(formData.opcoesAdicionais || []).length > 0 && (
                    <VStack align="stretch" spacing={2} mb={3}>
                      {(formData.opcoesAdicionais || []).map((adc, i) => (
                        <Flex key={i} align="center" gap={2} bg="whiteAlpha.100" p={2} borderRadius="lg" border="1px solid" borderColor="brand.primary">
                          <Text color="brand.light" fontSize="sm" flex="1" fontWeight="medium">{adc.nome}</Text>
                          <Text color="gray.400" fontSize="xs">Preço extra:</Text>
                          <NumberInput
                            size="xs"
                            min={0}
                            step={0.5}
                            precision={2}
                            value={adc.preco}
                            onChange={(val) => handleAtualizarPrecoAdicional(i, parseFloat(val) || 0)}
                            w="80px"
                          >
                            <NumberInputField
                              bg="whiteAlpha.100"
                              color="brand.secondary"
                              borderColor="brand.surfaceborder"
                              textAlign="center"
                              fontSize="xs"
                            />
                          </NumberInput>
                          <IconButton
                            aria-label="Remover adicional"
                            icon={<FiTrash2 />}
                            size="xs"
                            variant="ghost"
                            color="red.400"
                            onClick={() => handleRemoverOpcaoAdicional(i)}
                          />
                        </Flex>
                      ))}
                    </VStack>
                  )}

                  {/* Campo de busca autocomplete */}
                  <Box position="relative">
                    <InputGroup size="sm">
                      <InputLeftElement pointerEvents="none">
                        <FiSearch color="gray" />
                      </InputLeftElement>
                      <Input
                        placeholder="Buscar item do estoque..."
                        value={filtroAdicional}
                        onChange={(e) => { setFiltroAdicional(e.target.value); setShowSugestoesAdicional(true) }}
                        onFocus={() => setShowSugestoesAdicional(true)}
                        onBlur={() => setTimeout(() => setShowSugestoesAdicional(false), 150)}
                        bg="whiteAlpha.100"
                        color="brand.light"
                        borderColor="brand.surfaceborder"
                        _focus={{ borderColor: "brand.primary" }}
                      />
                    </InputGroup>
                    {showSugestoesAdicional && filtroAdicional.length > 0 && (
                      <Box
                        position="absolute"
                        zIndex="20"
                        bg="#0F172A"
                        w="100%"
                        borderRadius="md"
                        mt={1}
                        border="1px solid"
                        borderColor="brand.surfaceborder"
                        boxShadow="xl"
                        maxH="180px"
                        overflowY="auto"
                      >
                        {estoque
                          .filter(item =>
                            item.nome.toLowerCase().includes(filtroAdicional.toLowerCase()) &&
                            !(formData.opcoesAdicionais || []).some(a => a.nome === item.nome)
                          )
                          .slice(0, 8)
                          .map(item => (
                            <Box
                              key={item.id}
                              px={3} py={2}
                              cursor="pointer"
                              _hover={{ bg: "whiteAlpha.100" }}
                              onMouseDown={() => handleAdicionarOpcaoAdicional(item.nome, 0)}
                              borderBottom="1px solid"
                              borderColor="whiteAlpha.100"
                              _last={{ borderBottom: "none" }}
                            >
                              <Text color="brand.light" fontSize="sm">{item.nome}</Text>
                              <Text color="gray.500" fontSize="xs">{item.unidade} • Custo: R$ {item.precoUnitario.toFixed(2)}/{item.unidade}</Text>
                            </Box>
                          ))
                        }
                        {estoque.filter(item =>
                          item.nome.toLowerCase().includes(filtroAdicional.toLowerCase()) &&
                          !(formData.opcoesAdicionais || []).some(a => a.nome === item.nome)
                        ).length === 0 && (
                          <Box px={3} py={2}>
                            <Text color="gray.500" fontSize="sm">Nenhum item encontrado.</Text>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>

                <Divider borderColor="whiteAlpha.200" />

                {/* Itens a Remover via receita do produto */}
                <Box>
                  <Text color="red.300" fontWeight="bold" fontSize="sm" mb={1}>
                    Ingredientes que Podem ser Removidos
                  </Text>
                  <Text color="gray.500" fontSize="xs" mb={3}>
                    Marque os ingredientes da receita que o cliente pode pedir para remover. Remover não dá baixa no estoque.
                  </Text>

                  {itensEstoqueDoProdutoEditado.length === 0 ? (
                    <Box p={3} bg="whiteAlpha.50" borderRadius="lg" border="1px dashed" borderColor="whiteAlpha.200">
                      <Text color="gray.500" fontSize="xs" textAlign="center">
                        Este produto não possui ingredientes vinculados na Ficha Técnica. Vincule ingredientes primeiro para habilitar esta opção.
                      </Text>
                    </Box>
                  ) : (
                    <VStack align="stretch" spacing={2}>
                      {itensEstoqueDoProdutoEditado.map(assoc => {
                        const itemEstoque = estoque.find(i => i.id === assoc.itemId)
                        if (!itemEstoque) return null
                        const isMarcado = (formData.opcoesRemover || []).includes(itemEstoque.nome)
                        return (
                          <Flex
                            key={assoc.itemId}
                            p={3}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={isMarcado ? "red.500" : "whiteAlpha.200"}
                            bg={isMarcado ? "red.900" : "whiteAlpha.50"}
                            align="center"
                            justify="space-between"
                            cursor="pointer"
                            onClick={() => handleToggleRemover(itemEstoque.nome)}
                            _hover={{ borderColor: "red.400" }}
                            transition="all 0.15s"
                          >
                            <HStack>
                              <Switch
                                size="sm"
                                colorScheme="red"
                                isChecked={isMarcado}
                                pointerEvents="none"
                              />
                              <Text color={isMarcado ? "white" : "gray.300"} fontSize="sm" fontWeight={isMarcado ? "bold" : "normal"}>
                                {itemEstoque.nome}
                              </Text>
                            </HStack>
                            <Text color="gray.500" fontSize="xs">{assoc.quantidade} {itemEstoque.unidade}</Text>
                          </Flex>
                        )
                      })}
                    </VStack>
                  )}
                </Box>

              </VStack>
            </Collapse>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit}>{editId !== null ? "Atualizar" : "Salvar Produto"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Ficha Técnica / Receita */}
      <Modal isOpen={isOpenEstoque} onClose={onCloseEstoque} size="xl" isCentered motionPreset="none">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent bg="brand.surface" borderColor="brand.surfaceborder" borderWidth={1} borderRadius="2xl">
          <ModalHeader color="brand.light">
            Ficha Técnica: <Text as="span" color="brand.secondary">{produtoSelecionado?.nome}</Text>
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Box bg="whiteAlpha.50" p={4} borderRadius="xl" border="1px dashed" borderColor="brand.surfaceborder">
                <FormLabel color="gray.400" fontSize="sm">Vincular Ingrediente (Baixa no momento da venda)</FormLabel>
                <Flex gap={3} direction={{ base: "column", md: "row" }}>
                  <Box flex="2">
                    <Select
                      placeholder="Selecione um insumo"
                      bg="whiteAlpha.100"
                      color="brand.light"
                      borderColor="brand.surfaceborder"
                      onChange={(e) => setItemEstoqueSelecionado(Number(e.target.value))}
                      value={itemEstoqueSelecionado || ""}
                      sx={{"& > option":{background:"#0F172A",color:"white"}}}
                    >
                      {filteredEstoque.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome} ({item.unidade})
                        </option>
                      ))}
                    </Select>
                  </Box>
                  <Box flex="1">
                    <NumberInput min={1} value={quantidadeItem} onChange={(value) => setQuantidadeItem(Number(value))}>
                      <NumberInputField bg="whiteAlpha.100" color="brand.light" borderColor="brand.surfaceborder" />
                      <NumberInputStepper>
                        <NumberIncrementStepper color="brand.secondary" />
                        <NumberDecrementStepper color="brand.secondary" />
                      </NumberInputStepper>
                    </NumberInput>
                  </Box>
                  <Button variant="outline" color="brand.primary" borderColor="brand.primary" _hover={{ bg: "brand.primary", color: "white" }} onClick={handleAssociarItemEstoque} isDisabled={!itemEstoqueSelecionado}>
                    Vincular
                  </Button>
                </Flex>
              </Box>

              <Divider borderColor="whiteAlpha.200" />

              <Box>
                <Heading size="sm" color="brand.light" mb={4}>Ingredientes da Receita</Heading>
                {produtoSelecionado && produtoSelecionado.itensEstoque && produtoSelecionado.itensEstoque.length > 0 ? (
                  <VStack align="stretch" spacing={2}>
                    {produtoSelecionado.itensEstoque.map((associacao) => {
                      const item = estoque.find((i) => i.id === associacao.itemId)
                      return item ? (
                        <Flex key={associacao.itemId} justify="space-between" align="center" bg="whiteAlpha.50" p={3} borderRadius="lg" border="1px solid" borderColor="brand.surfaceborder">
                          <Box>
                            <Text color="brand.light" fontWeight="bold">{item.nome}</Text>
                            <Text color="gray.400" fontSize="xs">Custo ref: R$ {item.precoUnitario.toFixed(2)} / {item.unidade}</Text>
                          </Box>
                          <Flex align="center" gap={4}>
                            <Flex align="center" bg="whiteAlpha.100" px={2} py={1} borderRadius="md" gap={2}>
                              <NumberInput min={0.1} step={0.1} size="sm" w="70px" value={associacao.quantidade} onChange={(value) => handleAtualizarQuantidade(associacao.itemId, Number(value))}>
                                <NumberInputField textAlign="center" bg="transparent" border="none" color="brand.secondary" fontWeight="bold" />
                              </NumberInput>
                              <Text color="gray.400" fontSize="sm">{item.unidade}s</Text>
                            </Flex>
                            <IconButton
                              aria-label="Desassociar item"
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              color="red.400"
                              _hover={{ bg: "red.900", color: "white" }}
                              onClick={() => handleDesassociarItemEstoque(associacao.itemId)}
                            />
                          </Flex>
                        </Flex>
                      ) : null
                    })}
                  </VStack>
                ) : (
                  <Flex direction="column" align="center" justify="center" py={6} color="gray.500" bg="whiteAlpha.50" borderRadius="lg" border="1px dashed" borderColor="whiteAlpha.200">
                    <FiPackage size={24} style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <Text fontSize="sm">Sem receita cadastrada.</Text>
                  </Flex>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
             <Button variant="primary" onClick={onCloseEstoque} w="100%">Concluído</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default ProdutosPage
