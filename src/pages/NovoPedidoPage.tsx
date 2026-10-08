"use client"

import { useState, useEffect, useRef } from "react"
import {
  Box,
  Heading,
  VStack,
  Text,
  Button,
  Flex,
  Grid,
  GridItem,
  Image,
  useToast,
  Input,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  IconButton,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Checkbox,
  HStack,
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { FiPlus, FiMinus, FiSave, FiX, FiShoppingCart, FiUser, FiTag, FiSearch } from "react-icons/fi"
import { useData, type ItemPedido, type Cliente, Produto } from "../context/DataContext"

const MotionBox = motion(Box)
const MotionGridItem = motion(GridItem)


const NovoPedidoPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { produtos, addPedido, clientes, addCliente, getClienteByNome } = useData()
  
  // Modals hooks
  const { isOpen: isClientOpen, onOpen: onClientOpen, onClose: onClientClose } = useDisclosure()
  const { isOpen: isExtraOpen, onOpen: onExtraOpen, onClose: onExtraClose } = useDisclosure()

  // General State
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([])
  const [cliente, setCliente] = useState("")
  const [telefoneCliente, setTelefoneCliente] = useState("")
  const [mesa, setMesa] = useState("")
  const [observacaoGlobal, setObservacaoGlobal] = useState<{ [key: number]: string }>({})
  const [clienteExistente, setClienteExistente] = useState<Cliente | null>(null)
  const [clienteSugestoes, setClienteSugestoes] = useState<Cliente[]>([])

  // State for the Extras Modal
  const [produtoSelecionadoParaExtras, setProdutoSelecionadoParaExtras] = useState<Produto | null>(null)
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<{nome: string, preco: number}[]>([])
  const [removidosSelecionados, setRemovidosSelecionados] = useState<string[]>([])
  const [obsModal, setObsModal] = useState("")

  const categorias = [...new Set(produtos.map((p) => p.categoria))]
  const [buscaProduto, setBuscaProduto] = useState("")

  // Refs for keyboard shortcuts
  const clienteInputRef = useRef<HTMLInputElement>(null)
  const mesaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cliente.length > 2) {
      const sugestoes = clientes.filter((c) => c.nome.toLowerCase().includes(cliente.toLowerCase())).slice(0, 5)
      setClienteSugestoes(sugestoes)
      const existente = getClienteByNome(cliente)
      setClienteExistente(existente || null)
    } else {
      setClienteSugestoes([])
      setClienteExistente(null)
    }
  }, [cliente, clientes, getClienteByNome])

  useEffect(() => {
    // Keyboard shortcuts listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault()
        clienteInputRef.current?.focus()
      } else if (e.key === "F2") {
        e.preventDefault()
        mesaInputRef.current?.focus()
      } else if (e.key === "F12") {
        e.preventDefault()
        salvarComanda()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cliente, mesa, itensPedido]) // Re-bind function with latest state just in case F12 uses it

  const abrirModalExtras = (produto: Produto) => {
    // Abre o modal de personalização se o produto tiver personalizacaoAtiva habilitada
    if (produto.personalizacaoAtiva) {
      setProdutoSelecionadoParaExtras(produto)
      setAdicionaisSelecionados([])
      setRemovidosSelecionados([])
      setObsModal(observacaoGlobal[produto.id] || "")
      onExtraOpen()
    } else {
      adicionarItemDireto(produto, [], [], observacaoGlobal[produto.id] || "")
    }
  }

  const confirmarExtrasItem = () => {
    if (!produtoSelecionadoParaExtras) return
    adicionarItemDireto(produtoSelecionadoParaExtras, adicionaisSelecionados, removidosSelecionados, obsModal)
    onExtraClose()
  }

  const adicionarItemDireto = (
    produto: Produto, 
    adicionais: {nome: string, preco: number}[] = [], 
    removidos: string[] = [], 
    observacao: string = ""
  ) => {
    // Em pedidos complexos com adicionais diferentes, o ideal é não agrupar se forem diferentes.
    // Mas para simplificar, se os adicionais forem EXATAMENTE os mesmos, agrupamos.
    // Desta vez, vamos tratar cada clique de 'Adicionar' (especialmente com extras) como uma entidade que pode ou não agrupar.
    const hasExtras = adicionais.length > 0 || removidos.length > 0 || observacao.trim() !== ""
    
    // Procura item exato
    const itemExistenteIndex = itensPedido.findIndex((item) => {
        if (item.produto.id !== produto.id) return false
        // Só agrupa se não tiver extras ou se ambos tiverem 0 extras (e sem obs). Com extras, sempre entra como nova linha (para ser customizada por lanche).
        return !hasExtras && (!item.adicionais || item.adicionais.length === 0) && (!item.removidos || item.removidos.length === 0) && (!item.observacao)
    })

    if (itemExistenteIndex >= 0) {
      const novaLista = [...itensPedido]
      novaLista[itemExistenteIndex].quantidade += 1
      setItensPedido(novaLista)
    } else {
      const novoItem: ItemPedido = {
        produto,
        quantidade: 1,
        observacao,
        adicionais,
        removidos
      }
      setItensPedido([...itensPedido, novoItem])
    }
    
    // Limpa a observação global do input simples se ela foi usada
    setObservacaoGlobal({ ...observacaoGlobal, [produto.id]: "" })
  }

  const atualizarQuantidade = (indexDaLinha: number, quantidade: number) => {
    if (quantidade === 0) {
      setItensPedido(itensPedido.filter((_, i) => i !== indexDaLinha))
    } else {
      setItensPedido(itensPedido.map((item, i) => (i === indexDaLinha ? { ...item, quantidade } : item)))
    }
  }

  const removerItem = (indexDaLinha: number) => {
    setItensPedido(itensPedido.filter((_, i) => i !== indexDaLinha))
  }

  const calcularPrecoUnitarioItem = (item: ItemPedido) => {
    let precoBase = item.produto.preco
    if (item.adicionais) {
      precoBase += item.adicionais.reduce((acc, adic) => acc + adic.preco, 0)
    }
    return precoBase
  }

  const calcularTotal = () => {
    return itensPedido.reduce((total, item) => total + (calcularPrecoUnitarioItem(item) * item.quantidade), 0)
  }

  const handleSelecionarCliente = (clienteSelecionado: Cliente) => {
    setCliente(clienteSelecionado.nome)
    setTelefoneCliente(clienteSelecionado.telefone || "")
    setClienteExistente(clienteSelecionado)
    setClienteSugestoes([])
  }

  const salvarNovoCliente = async () => {
    if (!cliente.trim() || !telefoneCliente.trim()) {
      toast({ title: "Erro", description: "Preencha o nome e telefone do cliente", status: "error", duration: 3000, isClosable: true })
      return
    }
    let novoCliente: Cliente
    try {
      novoCliente = await addCliente({ nome: cliente, telefone: telefoneCliente, historicoPedidos: [] })
    } catch {
      return
    }
    setClienteExistente(novoCliente)
    toast({ title: "Cadastrado", description: `Cliente cadastrado!`, status: "success", duration: 3000 })
    onClientClose()
  }

  const salvarComanda = async () => {
    if (itensPedido.length === 0 || !cliente || !mesa) {
      toast({ title: "Atenção", description: "Preencha cliente, mesa e adicione pelo menos um item.", status: "warning", duration: 3000, isClosable: true })
      return
    }

    // O total exibido é uma prévia: o valor definitivo é calculado pelo servidor
    const valorTotal = calcularTotal()
    try {
      await addPedido({
      clienteId: clienteExistente?.id,
      mesa,
      cliente,
      itens: itensPedido.map((item) => ({
        produtoId: item.produto.id,
        nome: item.produto.nome,
        quantidade: item.quantidade,
        preco: calcularPrecoUnitarioItem(item),  // Preço unitário já inclui adicionais
        precoBase: item.produto.preco,           // Preço base separado para referência
        observacao: item.observacao,
        adicionais: item.adicionais || [],
        removidos: item.removidos || [],
      })),
      status: "aberto",
      timestamp: new Date(),
      valorTotal,
      })
    } catch {
      return
    }

    toast({ title: "Sucesso!", description: `Comanda criada.`, status: "success", duration: 3000 })
    navigate(`/pedidos`)
  }

  const toggleAdicional = (adc: {nome: string, preco: number}) => {
    if (adicionaisSelecionados.some(a => a.nome === adc.nome)) {
      setAdicionaisSelecionados(adicionaisSelecionados.filter(a => a.nome !== adc.nome))
    } else {
      setAdicionaisSelecionados([...adicionaisSelecionados, adc])
    }
  }

  const toggleRemover = (rem: string) => {
    if (removidosSelecionados.includes(rem)) {
      setRemovidosSelecionados(removidosSelecionados.filter(r => r !== rem))
    } else {
      setRemovidosSelecionados([...removidosSelecionados, rem])
    }
  }

  return (
    <Box maxW="1400px" mx="auto" w="100%">
      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap">
        <Heading size="xl" color="brand.light" fontWeight="700">Nova Comanda</Heading>
        <Flex gap={2} bg="blackAlpha.400" p={2} borderRadius="md" border="1px dashed" borderColor="whiteAlpha.200">
           <Text color="gray.400" fontSize="xs"><Badge>F1</Badge> Cliente</Text>
           <Text color="gray.400" fontSize="xs"><Badge>F2</Badge> Mesa</Text>
           <Text color="brand.primary" fontSize="xs"><Badge colorScheme="orange">F12</Badge> Finalizar</Text>
        </Flex>
      </Flex>

      <Flex direction={{ base: "column", lg: "row" }} gap={8} align="start">
        
        {/* Esquerda: Informações e Produtos */}
        <Box flex="2" w="100%">
          <Box variant="glass" p={6} mb={8} borderRadius="2xl">
            <Heading size="md" mb={6} color="brand.primary" letterSpacing="wide" textTransform="uppercase" fontSize="sm">
              Detalhes do Pedido
            </Heading>

            <Flex gap={6} direction={{ base: "column", md: "row" }}>
              <FormControl position="relative" flex="1">
                <FormLabel color="gray.400" fontSize="sm">Cliente</FormLabel>
                <Flex>
                  <Input
                    ref={clienteInputRef}
                    placeholder="Nome do cliente"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    bg="whiteAlpha.100"
                    color="brand.light"
                    border="1px solid"
                    borderColor="brand.surfaceborder"
                    _placeholder={{ color: "whiteAlpha.400" }}
                    _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px #FF6B00" }}
                  />
                  <IconButton
                    aria-label="Adicionar cliente"
                    icon={<FiUser />}
                    ml={3}
                    onClick={onClientOpen}
                    variant="outline"
                    color="brand.secondary"
                    borderColor="brand.surfaceborder"
                    _hover={{ bg: "whiteAlpha.200" }}
                  />
                </Flex>
                {clienteSugestoes.length > 0 && (
                  <Box position="absolute" zIndex="10" bg="brand.darker" width="100%" borderRadius="md" mt={2} border="1px solid" borderColor="brand.surfaceborder" boxShadow="xl">
                    {clienteSugestoes.map((c) => (
                      <Box key={c.id} p={3} cursor="pointer" _hover={{ bg: "whiteAlpha.100" }} onClick={() => handleSelecionarCliente(c)} borderBottom="1px solid" borderColor="whiteAlpha.100" _last={{ borderBottom: "none" }}>
                        <Text color="brand.light" fontWeight="medium">{c.nome}</Text>
                        {c.telefone && <Text fontSize="xs" color="gray.400">{c.telefone}</Text>}
                      </Box>
                    ))}
                  </Box>
                )}
              </FormControl>

              <FormControl flex="1">
                <FormLabel color="gray.400" fontSize="sm">Mesa/Senhas</FormLabel>
                <Input
                  ref={mesaInputRef}
                  placeholder="Ex: Mesa 1, Viagem"
                  value={mesa}
                  onChange={(e) => setMesa(e.target.value)}
                  bg="whiteAlpha.100"
                  color="brand.light"
                  border="1px solid"
                  borderColor="brand.surfaceborder"
                  _placeholder={{ color: "whiteAlpha.400" }}
                  _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px #FF6B00" }}
                />
              </FormControl>
            </Flex>
          </Box>

          <Box variant="glass" borderRadius="2xl" overflow="hidden">
            <Tabs variant="soft-rounded" colorScheme="orange" p={4}>
              {/* Campo de busca */}
              <Flex mb={4} position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1} pointerEvents="none">
                  <FiSearch color="#9CA3AF" size={16} />
                </Box>
                <Input
                  placeholder="Buscar produto..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  pl={9}
                  bg="whiteAlpha.100"
                  color="brand.light"
                  border="1px solid"
                  borderColor="brand.surfaceborder"
                  borderRadius="full"
                  _placeholder={{ color: "whiteAlpha.400" }}
                  _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px #FF6B00" }}
                />
              </Flex>

              <TabList mb={4} overflowX="auto" pb={2} css={{"&::-webkit-scrollbar":{display:"none"}}}>
                <Tab color="brand.light" _selected={{ bg: "brand.primary", color: "white" }}>Todos</Tab>
                {categorias.map((cat) => (
                  <Tab key={cat} color="brand.light" _selected={{ bg: "brand.primary", color: "white" }}>
                    {cat}
                  </Tab>
                ))}
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
                    {produtos.filter((p) => p.ativo && (!buscaProduto || p.nome.toLowerCase().includes(buscaProduto.toLowerCase()))).map((produto, idx) => (
                      <MotionGridItem
                        key={produto.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                        bg="whiteAlpha.50" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100"
                        whileHover={{ y: -5, boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }}
                      >
                        <Flex direction="column" h="100%">
                          {produto.imagem && <Image src={produto.imagem} alt={produto.nome} h="120px" w="100%" objectFit="cover" borderRadius="lg" mb={4} />}
                          <Text fontWeight="bold" color="brand.light" fontSize="lg" mb={1}>{produto.nome}</Text>
                          <Text color="brand.secondary" fontWeight="600" mb={4}>R$ {produto.preco.toFixed(2)}</Text>
                          <Box mt="auto">
                            <Input
                              placeholder="Observação rápida" size="sm" value={observacaoGlobal[produto.id] || ""} onChange={(e) => setObservacaoGlobal({ ...observacaoGlobal, [produto.id]: e.target.value })}
                              bg="whiteAlpha.100" border="none" color="brand.light" mb={3}
                            />
                            <Button
                              w="100%" size="sm" leftIcon={<FiPlus />} variant="outline" borderColor="brand.primary" color="brand.primary"
                              _hover={{ bg: "brand.primary", color: "white" }} onClick={() => abrirModalExtras(produto)}
                            >
                              Adicionar
                            </Button>
                          </Box>
                        </Flex>
                      </MotionGridItem>
                    ))}
                  </Grid>
                </TabPanel>
                
                {categorias.map((categoria) => (
                  <TabPanel key={categoria} px={0}>
                    <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
                      {produtos.filter((p) => p.categoria === categoria && p.ativo && (!buscaProduto || p.nome.toLowerCase().includes(buscaProduto.toLowerCase()))).map((produto, idx) => (
                        <MotionGridItem
                          key={produto.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                          bg="whiteAlpha.50" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100"
                        >
                          <Flex direction="column" h="100%">
                            {produto.imagem && <Image src={produto.imagem} alt={produto.nome} h="120px" w="100%" objectFit="cover" borderRadius="lg" mb={4} />}
                            <Text fontWeight="bold" color="brand.light" fontSize="lg" mb={1}>{produto.nome}</Text>
                            <Text color="brand.secondary" fontWeight="600" mb={4}>R$ {produto.preco.toFixed(2)}</Text>
                            <Box mt="auto">
                              <Input
                                placeholder="Observação rápida" size="sm" value={observacaoGlobal[produto.id] || ""} onChange={(e) => setObservacaoGlobal({ ...observacaoGlobal, [produto.id]: e.target.value })}
                                bg="whiteAlpha.100" border="none" color="brand.light" mb={3}
                              />
                              <Button
                                w="100%" size="sm" leftIcon={<FiPlus />} variant="outline" borderColor="brand.primary" color="brand.primary"
                                _hover={{ bg: "brand.primary", color: "white" }} onClick={() => abrirModalExtras(produto)}
                              >
                                Adicionar
                              </Button>
                            </Box>
                          </Flex>
                        </MotionGridItem>
                      ))}
                    </Grid>
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </Box>
        </Box>

        {/* Direita: Carrinho / Resumo */}
        <Box 
          flex="1" w="100%" minW={{ lg: "350px" }} variant="glass" p={6} borderRadius="2xl" position="sticky" top="100px"
        >
          <Flex justify="space-between" align="center" mb={6}>
            <Heading size="md" color="brand.light">Resumo do Pedido</Heading>
            <Badge colorScheme="orange" px={3} py={1} borderRadius="full">{itensPedido.reduce((acc, i) => acc + i.quantidade, 0)} un.</Badge>
          </Flex>

          {itensPedido.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={12} color="gray.500">
              <FiShoppingCart size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <Text>Nenhum item na comanda</Text>
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch" maxH="450px" overflowY="auto" pr={2} css={{"&::-webkit-scrollbar":{width:"4px"},"&::-webkit-scrollbar-thumb":{background:"rgba(255,107,0,0.5)"}}}>
              {itensPedido.map((item, index) => (
                <MotionBox 
                  key={`${item.produto.id}-${index}`} 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  bg="whiteAlpha.50" p={3} borderRadius="lg" border="1px dashed" borderColor="whiteAlpha.200"
                >
                  <Flex justify="space-between" align="start" mb={2}>
                    <Box flex="1">
                      <Text fontWeight="600" color="brand.light">{item.produto.nome}</Text>
                      {item.adicionais && item.adicionais.map((adic, i) => (
                         <Flex key={`adic-${i}`} align="center" mt={1}>
                            <FiPlus color="#48BB78" size={10} style={{ marginRight: '4px' }}/>
                            <Text fontSize="xs" color="gray.300">{adic.nome} (+R$ {adic.preco.toFixed(2)})</Text>
                         </Flex>
                      ))}
                      {item.removidos && item.removidos.map((rem, i) => (
                         <Flex key={`rem-${i}`} align="center" mt={1}>
                            <FiMinus color="#F56565" size={10} style={{ marginRight: '4px' }}/>
                            <Text fontSize="xs" color="gray.300" textDecoration="line-through">{rem}</Text>
                         </Flex>
                      ))}
                      {item.observacao && (
                        <Flex align="center" mt={1}>
                          <FiTag color="#ECC94B" size={10} style={{ marginRight: '4px' }}/>
                          <Text fontSize="xs" color="yellow.400">{item.observacao}</Text>
                        </Flex>
                      )}
                    </Box>
                    <IconButton aria-label="Remover" icon={<FiX />} size="xs" colorScheme="red" variant="ghost" onClick={() => removerItem(index)} />
                  </Flex>
                  
                  <Flex justify="space-between" align="center" mt={3} pt={2} borderTop="1px solid" borderColor="whiteAlpha.100">
                    <Text color="brand.secondary" fontWeight="bold">
                      R$ {(calcularPrecoUnitarioItem(item) * item.quantidade).toFixed(2)}
                    </Text>
                    <Flex bg="whiteAlpha.100" borderRadius="md" p={1} align="center">
                      <IconButton aria-label="Menos" icon={<FiMinus />} size="xs" variant="ghost" color="brand.light" onClick={() => atualizarQuantidade(index, Math.max(0, item.quantidade - 1))} />
                      <Text mx={3} color="brand.light" fontWeight="bold">{item.quantidade}</Text>
                      <IconButton aria-label="Mais" icon={<FiPlus />} size="xs" variant="ghost" color="brand.light" onClick={() => atualizarQuantidade(index, item.quantidade + 1)} />
                    </Flex>
                  </Flex>
                </MotionBox>
              ))}
            </VStack>
          )}

          <Divider borderColor="whiteAlpha.200" my={6} />

          <Flex justify="space-between" align="center" mb={6}>
            <Text color="gray.400" fontSize="lg">Total Estimado</Text>
            <Text color="brand.secondary" fontSize="3xl" fontWeight="bold">
              R$ {calcularTotal().toFixed(2)}
            </Text>
          </Flex>

          <Button
            w="100%" size="lg" variant="primary" leftIcon={<FiSave />} onClick={salvarComanda}
            isDisabled={itensPedido.length === 0} h="60px"
          >
            Finalizar Nova Comanda (F12)
          </Button>
        </Box>
      </Flex>

      {/* Modal Adicionais / Personalização */}
      <Modal isOpen={isExtraOpen} onClose={onExtraClose} isCentered size="md" motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent bg="brand.surface" borderColor="brand.surfaceborder" borderWidth={1} borderRadius="2xl">
          <ModalHeader color="brand.light" pb={0}>Personalizar Item</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody py={4}>
             <Heading size="sm" color="brand.secondary" mb={4}>{produtoSelecionadoParaExtras?.nome}</Heading>
             
             {/* Seção de Adicionais — só exibe se o produto tiver opções */}
             {(produtoSelecionadoParaExtras?.opcoesAdicionais || []).length > 0 && (
               <>
                 <Text fontWeight="600" color="gray.400" fontSize="sm" mb={2}>Adicionais (Extras):</Text>
                 <VStack align="stretch" spacing={2} mb={6}>
                   {(produtoSelecionadoParaExtras?.opcoesAdicionais || []).map((adc) => {
                     const isChecked = adicionaisSelecionados.some(a => a.nome === adc.nome)
                     return (
                       <Flex key={adc.nome} p={3} bg={isChecked ? "brand.primaryDark" : "whiteAlpha.50"} borderRadius="md" justify="space-between" align="center" cursor="pointer" onClick={() => toggleAdicional(adc)} border="1px solid" borderColor={isChecked ? "brand.primary" : "whiteAlpha.100"}>
                          <HStack>
                             <Checkbox colorScheme="orange" isChecked={isChecked} pointerEvents="none" />
                             <Text color={isChecked ? "white" : "gray.300"} fontWeight={isChecked ? "bold" : "normal"}>{adc.nome}</Text>
                          </HStack>
                          <Text color="brand.secondary" fontWeight="bold">+ R$ {adc.preco.toFixed(2)}</Text>
                       </Flex>
                     )
                   })}
                 </VStack>
               </>
             )}

             {/* Seção de Remover — só exibe se o produto tiver ingredientes cadastrados */}
             {(produtoSelecionadoParaExtras?.opcoesRemover || []).length > 0 && (
               <>
                 <Text fontWeight="600" color="gray.400" fontSize="sm" mb={2}>Remover ingredientes:</Text>
                 <VStack align="stretch" spacing={2} mb={6}>
                   {(produtoSelecionadoParaExtras?.opcoesRemover || []).map((rem) => {
                     const isChecked = removidosSelecionados.includes(rem)
                     return (
                       <Flex key={rem} p={3} bg={isChecked ? "red.900" : "whiteAlpha.50"} borderRadius="md" justify="space-between" align="center" cursor="pointer" onClick={() => toggleRemover(rem)} border="1px solid" borderColor={isChecked ? "red.500" : "whiteAlpha.100"}>
                          <HStack>
                             <Checkbox colorScheme="red" isChecked={isChecked} pointerEvents="none" />
                             <Text color={isChecked ? "white" : "gray.300"} as={isChecked ? "s" : undefined}>{rem}</Text>
                          </HStack>
                       </Flex>
                     )
                   })}
                 </VStack>
               </>
             )}

             {/* Se nenhuma seção acima for exibida, mostra aviso */}
             {(produtoSelecionadoParaExtras?.opcoesAdicionais || []).length === 0 &&
              (produtoSelecionadoParaExtras?.opcoesRemover || []).length === 0 && (
               <Text color="gray.500" fontSize="sm" textAlign="center" mb={4}>
                 Apenas uma observação adicional é possível para este item.
               </Text>
             )}

             <Text fontWeight="600" color="gray.400" fontSize="sm" mb={2}>Observação Adicional:</Text>
             <Input 
                value={obsModal} onChange={(e) => setObsModal(e.target.value)} 
                placeholder="Exceções ou notas para cozinha" bg="whiteAlpha.100" color="white" border="none"
             />

          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.100" bg="blackAlpha.200" borderBottomRadius="2xl">
            <Button variant="ghost" color="gray.400" mr={3} onClick={onExtraClose}>Cancelar</Button>
            <Button variant="primary" onClick={confirmarExtrasItem}>Confirmar e Adicionar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Novo Cliente */}
      <Modal isOpen={isClientOpen} onClose={onClientClose} isCentered motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent bg="brand.surface" borderColor="brand.surfaceborder" borderWidth={1} borderRadius="2xl">
          <ModalHeader color="brand.light">Cadastrar Cliente</ModalHeader>
          <ModalBody py={4}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color="gray.400">Nome Completo</FormLabel>
                <Input value={cliente} onChange={(e) => setCliente(e.target.value)} bg="whiteAlpha.50" color="brand.light" border="1px solid" borderColor="brand.surfaceborder" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="gray.400">Telefone / WhatsApp</FormLabel>
                <Input value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} bg="whiteAlpha.50" color="brand.light" border="1px solid" borderColor="brand.surfaceborder" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="brand.light" mr={3} onClick={onClientClose}>Cancelar</Button>
            <Button variant="primary" onClick={salvarNovoCliente}>Salvar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default NovoPedidoPage
