"use client"

import { useState, useEffect } from "react"
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
  Icon,
  Spinner,
  ModalCloseButton,
  Checkbox,
  HStack,
} from "@chakra-ui/react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams, useNavigate } from "react-router-dom"
import { FiPlus, FiMinus, FiSave, FiX, FiShoppingCart, FiAlertCircle, FiArrowLeft, FiTag } from "react-icons/fi"
import { useData, type ItemPedido, Produto } from "../context/DataContext"

const MotionBox = motion(Box)
const MotionGridItem = motion(GridItem)

const OPCOES_ADICIONAIS = [
  { nome: "Bacon +", preco: 2.50 },
  { nome: "Salsicha Extra", preco: 3.00 },
  { nome: "Queijo Cheddar", preco: 2.00 },
  { nome: "Batata Palha Extra", preco: 1.50 }
]
const OPCOES_REMOVER = [
  "Sem Milho",
  "Sem Ervilha",
  "Sem Maionese",
  "Sem Ketchup",
  "Sem Mostarda"
]

const EditarPedidoPage = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  
  const { isOpen, onOpen, onClose } = useDisclosure() // Vazia comanda modal
  const { isOpen: isExtraOpen, onOpen: onExtraOpen, onClose: onExtraClose } = useDisclosure()

  const { produtos, getPedido, updatePedido, loading } = useData()

  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([])
  const [observacaoGlobal, setObservacaoGlobal] = useState<{ [key: number]: string }>({})
  const [pedido, setPedido] = useState<ReturnType<typeof getPedido> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Extras Modal state
  const [produtoSelecionadoParaExtras, setProdutoSelecionadoParaExtras] = useState<Produto | null>(null)
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<{nome: string, preco: number}[]>([])
  const [removidosSelecionados, setRemovidosSelecionados] = useState<string[]>([])
  const [obsModal, setObsModal] = useState("")

  const categorias = [...new Set(produtos.map((p) => p.categoria))]

  useEffect(() => {
    // Ao abrir a URL direto (ou recarregar), espera os dados chegarem antes de procurar o pedido
    if (loading) return
    if (!pedidoId) {
      setErro("ID do pedido não informado")
      setCarregando(false)
      return
    }

    const pedidoEncontrado = getPedido(Number(pedidoId))

    if (!pedidoEncontrado) {
      setErro("Pedido não encontrado")
      setCarregando(false)
      return
    }

    setPedido(pedidoEncontrado)

    const itensConvertidos: ItemPedido[] = pedidoEncontrado.itens.map((item) => {
      const produto =
        (item.produtoId != null ? produtos.find((p) => p.id === item.produtoId) : undefined) ??
        produtos.find((p) => p.nome === item.nome)
      if (!produto) {
        const tempProduto = {
          id: -1,
          nome: item.nome,
          preco: item.preco,
          imagem: "/placeholder.svg?height=100&width=100",
          categoria: "Sem categoria",
          ativo: true,
        }
        return { 
          produto: tempProduto, 
          quantidade: item.quantidade, 
          observacao: item.observacao,
          adicionais: item.adicionais || [],
          removidos: item.removidos || []
        }
      }
      return { 
        produto, 
        quantidade: item.quantidade, 
        observacao: item.observacao,
        adicionais: item.adicionais || [],
        removidos: item.removidos || []
      }
    })

    setItensPedido(itensConvertidos)
    setCarregando(false)
  }, [pedidoId, getPedido, produtos, loading])

  const abrirModalExtras = (produto: Produto) => {
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
    const hasExtras = adicionais.length > 0 || removidos.length > 0 || observacao.trim() !== ""
    
    // Procura por item idêntico e sem modificações
    const itemExistenteIndex = itensPedido.findIndex((item) => {
        if (item.produto.id !== produto.id) return false
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

  const salvarComanda = async () => {
    if (!pedido) return

    if (itensPedido.length === 0) {
      onOpen()
      return
    }

    const pedidoAtualizado = {
      ...pedido,
      itens: itensPedido.map((item) => ({
        produtoId: item.produto.id > 0 ? item.produto.id : undefined,
        nome: item.produto.nome,
        quantidade: item.quantidade,
        preco: calcularPrecoUnitarioItem(item), // Agora o preço é o base + adicionais
        precoBase: item.produto.preco,
        observacao: item.observacao,
        adicionais: item.adicionais,
        removidos: item.removidos
      })),
      valorTotal: calcularTotal(),
    }

    try {
      await updatePedido(pedidoAtualizado)
    } catch {
      return
    }

    toast({
      title: "Comanda atualizada",
      description: `Comanda #${pedidoId} atualizada!`,
      status: "success",
      duration: 3000,
    })

    navigate(`/pedidos`)
  }

  const confirmarSalvarVazia = async () => {
    if (!pedido) return
    const pedidoAtualizado = { ...pedido, itens: [], valorTotal: 0 }
    try {
      await updatePedido(pedidoAtualizado)
    } catch {
      return
    }
    onClose()
    toast({
      title: "Comanda atualizada",
      description: `Comanda #${pedidoId} atualizada (vazia)!`,
      status: "success",
      duration: 3000,
    })
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

  if (carregando) {
    return (
      <Flex justify="center" align="center" h="60vh">
        <Spinner size="xl" color="brand.primary" />
      </Flex>
    )
  }

  if (erro || !pedido) {
    return (
      <Flex direction="column" align="center" justify="center" h="60vh" gap={4}>
        <Icon as={FiAlertCircle} boxSize={12} color="red.500" />
        <Text color="brand.light" fontSize="xl">{erro || "Pedido não encontrado"}</Text>
        <Button variant="primary" onClick={() => navigate("/pedidos")}>Voltar para Comandas</Button>
      </Flex>
    )
  }

  return (
    <Box maxW="1400px" mx="auto" w="100%">
      <Flex align="center" gap={4} mb={8}>
        <IconButton
          icon={<FiArrowLeft />}
          aria-label="Voltar"
          onClick={() => navigate("/pedidos")}
          variant="ghost"
          isRound
          color="brand.light"
          _hover={{ bg: "whiteAlpha.200" }}
        />
        <Box>
          <Heading size="xl" color="brand.light" fontWeight="700">Editar Comanda</Heading>
          <Text color="brand.secondary" mt={1}>#{pedidoId}</Text>
        </Box>
      </Flex>

      <Flex direction={{ base: "column", lg: "row" }} gap={8}>
        {/* Painel de Produtos */}
        <Box flex="1.5" minW="0">
          <Box variant="glass" bg="whiteAlpha.50" p={5} borderRadius="2xl" mb={6} border="1px solid" borderColor="brand.surfaceborder">
            <Flex justify="space-between" align="center" mb={4}>
               <Heading size="sm" color="gray.400" textTransform="uppercase" letterSpacing="wider">Informações da Comanda</Heading>
               <Badge colorScheme="green" px={3} py={1} borderRadius="full">Aberta</Badge>
            </Flex>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Box bg="whiteAlpha.100" p={4} borderRadius="xl" border="1px dashed" borderColor="whiteAlpha.200">
                <Text color="gray.500" fontSize="xs" mb={1}>Cliente</Text>
                <Text color="brand.light" fontWeight="bold" fontSize="lg">{pedido.cliente}</Text>
              </Box>
              <Box bg="whiteAlpha.100" p={4} borderRadius="xl" border="1px dashed" borderColor="whiteAlpha.200">
                <Text color="gray.500" fontSize="xs" mb={1}>Mesa / Destino</Text>
                <Text color="brand.light" fontWeight="bold" fontSize="lg">{pedido.mesa}</Text>
              </Box>
            </Grid>
          </Box>

          <Tabs variant="soft-rounded" colorScheme="orange" isLazy>
            <TabList overflowX="auto" overflowY="hidden" py={2} mb={4} sx={{
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none", scrollbarWidth: "none"
            }}>
              <Tab color="gray.400" _selected={{ bg: "brand.primary", color: "white" }} mr={2}>Cardápio Geral</Tab>
              {categorias.map(cat => (
                <Tab key={cat} color="gray.400" _selected={{ bg: "brand.primary", color: "white" }} mr={2}>{cat}</Tab>
              ))}
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }} gap={4}>
                  <AnimatePresence>
                    {produtos.filter(p => p.ativo).map((produto, i) => (
                       <MotionGridItem 
                        key={produto.id}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      >
                         <Box variant="glass" bg="whiteAlpha.50" p={4} borderRadius="xl" h="100%" display="flex" flexDirection="column" border="1px solid" borderColor="whiteAlpha.100">
                          <Image src={produto.imagem || "/placeholder.svg"} alt={produto.nome} boxSize="100px" objectFit="cover" borderRadius="xl" mb={4} alignSelf="center" boxShadow="md" />
                          <Heading size="sm" color="brand.light" mb={1} lineHeight="1.2">{produto.nome}</Heading>
                          <Text color="brand.secondary" fontWeight="bold" fontSize="lg" mb={3}>R$ {produto.preco.toFixed(2)}</Text>
                          
                          <Input
                            placeholder="Observação rápida" size="sm" value={observacaoGlobal[produto.id] || ""} onChange={(e) => setObservacaoGlobal({ ...observacaoGlobal, [produto.id]: e.target.value })}
                            bg="blackAlpha.400" color="white" border="none" borderRadius="md" mb={3} mt="auto"
                            _placeholder={{ color: "gray.500" }} _focus={{ bg: "whiteAlpha.100", boxShadow: "0 0 0 1px #FF6B00" }}
                          />
                          <Button
                            leftIcon={<FiPlus />} variant="primary" size="sm" w="100%"
                            onClick={() => abrirModalExtras(produto)} boxShadow="0 4px 10px rgba(255,107,0,0.3)"
                          >
                            Adicionar
                          </Button>
                         </Box>
                      </MotionGridItem>
                    ))}
                  </AnimatePresence>
                </Grid>
              </TabPanel>

              {categorias.map(categoria => (
                <TabPanel key={categoria} px={0}>
                  <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }} gap={4}>
                    <AnimatePresence>
                      {produtos.filter(p => p.categoria === categoria && p.ativo).map((produto, i) => (
                        <MotionGridItem 
                          key={produto.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                        >
                          <Box variant="glass" bg="whiteAlpha.50" p={4} borderRadius="xl" h="100%" display="flex" flexDirection="column" border="1px solid" borderColor="whiteAlpha.100">
                            <Image src={produto.imagem || "/placeholder.svg"} alt={produto.nome} boxSize="100px" objectFit="cover" borderRadius="xl" mb={4} alignSelf="center" boxShadow="md" />
                            <Heading size="sm" color="brand.light" mb={1} lineHeight="1.2">{produto.nome}</Heading>
                            <Text color="brand.secondary" fontWeight="bold" fontSize="lg" mb={3}>R$ {produto.preco.toFixed(2)}</Text>
                            
                            <Input
                              placeholder="Observação rápida" size="sm" value={observacaoGlobal[produto.id] || ""} onChange={(e) => setObservacaoGlobal({ ...observacaoGlobal, [produto.id]: e.target.value })}
                              bg="blackAlpha.400" color="white" border="none" borderRadius="md" mb={3} mt="auto" _placeholder={{ color: "gray.500" }}
                            />
                            <Button
                              leftIcon={<FiPlus />} variant="primary" size="sm" w="100%" onClick={() => abrirModalExtras(produto)}
                            >
                              Adicionar
                            </Button>
                          </Box>
                        </MotionGridItem>
                      ))}
                    </AnimatePresence>
                  </Grid>
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Box>

        {/* Resumo Sidebar */}
        <Box flex={{ base: "1", lg: "0 0 400px" }}>
          <Box variant="glass" p={6} borderRadius="2xl" position="sticky" top="20px" display="flex" flexDirection="column" maxH="calc(100vh - 40px)">
            <Flex justify="space-between" align="center" mb={6}>
              <Flex align="center" gap={3}>
                <Box p={2} bg="brand.primary" borderRadius="md" color="white"><FiShoppingCart size={18} /></Box>
                <Heading size="md" color="brand.light">Itens da Comanda</Heading>
              </Flex>
            </Flex>

            <Box flex="1" overflowY="auto" pr={2} sx={{ "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-track": { background: "rgba(255,255,255,0.05)" }, "&::-webkit-scrollbar-thumb": { background: "brand.primary", borderRadius: "24px" } }}>
              {itensPedido.length === 0 ? (
                 <Flex direction="column" align="center" justify="center" h="100%" minH="200px" color="gray.500">
                    <FiShoppingCart size={40} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <Text fontSize="sm">Comanda vazia</Text>
                 </Flex>
              ) : (
                <VStack spacing={3} align="stretch" pb={4}>
                  <AnimatePresence>
                    {itensPedido.map((item, index) => (
                      <MotionBox 
                        key={`${item.produto.id}-${index}`} 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        bg="whiteAlpha.50" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100"
                      >
                         <Flex justify="space-between" align="start" mb={2}>
                           <Box flex="1" mr={3}>
                            <Flex align="center" gap={2} mb={1}>
                              <Text fontWeight="bold" color="brand.light" noOfLines={1} fontSize="sm">{item.produto.nome}</Text>
                              <Badge colorScheme="orange" fontSize="2xs" variant="subtle" px={2} borderRadius="full">{item.produto.categoria}</Badge>
                            </Flex>
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
                              <Flex align="start" gap={1} mt={2}>
                                <FiTag color="gray" size={10} style={{ marginTop: '3px' }}/>
                                <Text fontSize="xs" color="gray.400">{item.observacao}</Text>
                              </Flex>
                            )}
                           </Box>
                           <IconButton
                              aria-label="Remover" icon={<FiX />} size="xs" variant="ghost" color="red.400" _hover={{ bg: "red.500", color: "white" }} onClick={() => removerItem(index)}
                            />
                         </Flex>
                         
                         <Flex justify="space-between" align="center" mt={3} pt={2} borderTop="1px solid" borderColor="whiteAlpha.100">
                           <Text color="brand.secondary" fontWeight="700" fontSize="sm">
                              R$ {(calcularPrecoUnitarioItem(item) * item.quantidade).toFixed(2)}
                           </Text>
                           <Flex bg="blackAlpha.500" borderRadius="full" p={1} align="center" border="1px solid" borderColor="whiteAlpha.200">
                             <IconButton aria-label="Menos" icon={<FiMinus />} size="xs" isRound variant="ghost" color="gray.400" _hover={{ color: "brand.primary" }} onClick={() => atualizarQuantidade(index, Math.max(0, item.quantidade - 1))} />
                             <Text color="brand.light" fontWeight="bold" fontSize="sm" w="24px" textAlign="center">{item.quantidade}</Text>
                             <IconButton aria-label="Mais" icon={<FiPlus />} size="xs" isRound variant="ghost" color="gray.400" _hover={{ color: "brand.primary" }} onClick={() => atualizarQuantidade(index, item.quantidade + 1)} />
                           </Flex>
                         </Flex>
                      </MotionBox>
                    ))}
                  </AnimatePresence>
                </VStack>
              )}
            </Box>

            <Box pt={4} mt="auto" borderTop="1px dashed" borderColor="whiteAlpha.200">
              <Flex justify="space-between" align="center" mb={5}>
                <Text color="gray.400" fontSize="lg" fontWeight="500">Total</Text>
                <Text color="brand.primary" fontSize="3xl" fontWeight="800">R$ {calcularTotal().toFixed(2)}</Text>
              </Flex>
              
              <Button w="100%" variant="primary" size="lg" h="60px" borderRadius="xl" fontSize="lg" onClick={salvarComanda} leftIcon={<FiSave />} boxShadow="0 10px 25px rgba(255,107,0,0.3)">
                Salvar Alterações
              </Button>
            </Box>
          </Box>
        </Box>
      </Flex>

      {/* Modal Adicionais (Upsell) */}
      <Modal isOpen={isExtraOpen} onClose={onExtraClose} isCentered size="md" motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent bg="brand.surface" borderColor="brand.surfaceborder" borderWidth={1} borderRadius="2xl">
          <ModalHeader color="brand.light" pb={0}>Personalizar Item</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody py={4}>
             <Heading size="sm" color="brand.secondary" mb={4}>{produtoSelecionadoParaExtras?.nome}</Heading>
             
             {/* Seção de Adicionais — só exibe se o produto tiver adicionais cadastrados */}
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
                placeholder="Excepções ou notas para cozinha" bg="whiteAlpha.100" color="white" border="none"
             />

          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.100" bg="blackAlpha.200" borderBottomRadius="2xl">
            <Button variant="ghost" color="gray.400" mr={3} onClick={onExtraClose}>Cancelar</Button>
            <Button variant="primary" onClick={confirmarExtrasItem}>Confirmar e Adicionar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal salvar comanda vazia */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent bg="brand.surface" borderColor="brand.surfaceborder" borderWidth={1} borderRadius="2xl">
          <ModalHeader color="brand.light">Atenção</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            <Flex direction="column" align="center" textAlign="center" gap={4}>
              <Icon as={FiAlertCircle} color="yellow.400" boxSize={12} />
              <Text color="gray.300" fontSize="lg">A comanda ficará <Text as="span" fontWeight="bold" color="white">sem nenhum item</Text>. Deseja realmente salvar assim?</Text>
            </Flex>
          </ModalBody>
          <ModalFooter>
             <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>Cancelar</Button>
             <Button variant="primary" onClick={confirmarSalvarVazia}>Sim, salvar vazia</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default EditarPedidoPage
