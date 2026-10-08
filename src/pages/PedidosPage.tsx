"use client"

import { useState, useEffect } from "react"
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Flex,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Badge,
  IconButton,
  Divider,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
} from "@chakra-ui/react"
import { motion, Variants } from "framer-motion"
import { Link as RouterLink } from "react-router-dom"
import { FiEdit, FiCreditCard, FiPlus, FiMinus, FiTag, FiTrash2, FiSearch, FiRefreshCw } from "react-icons/fi"
import { useData, type Pedido } from "../context/DataContext"

const MotionBox = motion(Box)

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants: Variants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

const PedidosPage = () => {
  const toast = useToast()
  const { pedidos, updatePedido, deletePedido, refreshData } = useData()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "aberto" | "fechado">("todos")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let filtered = [...pedidos]

    // Aplicar filtro de status
    if (statusFilter !== "todos") {
      filtered = filtered.filter((p) => p.status === statusFilter)
    } else {
      filtered = filtered.filter((p) => p.status === "aberto" || p.status === "fechado")
    }

    // Aplicar busca por termo
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.cliente.toLowerCase().includes(term) ||
          p.mesa.toLowerCase().includes(term) ||
          p.id.toString().includes(term),
      )
    }

    // Ordenar por timestamp (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setFilteredPedidos(filtered)
  }, [pedidos, searchTerm, statusFilter])

  const handlePedidoClick = (pedido: Pedido) => {
    setSelectedPedido(pedido)
    onOpen()
  }

  const fecharComanda = async (id: number) => {
    const pedido = pedidos.find((p) => p.id === id)
    if (pedido) {
      try {
        await updatePedido({ ...pedido, status: "fechado" })
      } catch {
        return
      }
      setSelectedPedido({ ...pedido, status: "fechado" })

      toast({
        title: "Comanda fechada",
        description: `A comanda #${id} foi fechada e está pronta para pagamento.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const reabrirComanda = async (id: number) => {
    const pedido = pedidos.find((p) => p.id === id)
    if (pedido) {
      try {
        await updatePedido({ ...pedido, status: "aberto" })
      } catch {
        return
      }
      setSelectedPedido({ ...pedido, status: "aberto" })

      toast({
        title: "Comanda reaberta",
        description: `A comanda #${id} foi reaberta para adicionar mais itens.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const excluirComanda = async (id: number) => {
    try {
      await deletePedido(id)
    } catch {
      return
    }
    onClose()

    toast({
      title: "Comanda excluída",
      description: `A comanda #${id} foi excluída com sucesso.`,
      status: "error",
      duration: 3000,
      isClosable: true,
    })
  }

  const calcularTotal = (pedido: Pedido) => {
    return pedido.itens.reduce((total, item) => total + item.preco * item.quantidade, 0)
  }

  const formatarHora = (dateStr: Date) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
      toast({
        title: "Dados atualizados",
        description: "As comandas foram sincronizadas.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível sincronizar.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Box maxW="1200px" mx="auto" w="100%">
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <HStack spacing={2} bg="brand.surface" p={1} borderRadius="full" border="1px solid" borderColor="brand.surfaceborder" backdropFilter="blur(10px)">
          <Button
            variant={statusFilter === "todos" ? "primary" : "ghost"}
            size="sm"
            borderRadius="full"
            px={6}
            color={statusFilter === "todos" ? "white" : "brand.light"}
            onClick={() => setStatusFilter("todos")}
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === "aberto" ? "primary" : "ghost"}
            size="sm"
            borderRadius="full"
            px={6}
            color={statusFilter === "aberto" ? "white" : "brand.light"}
            onClick={() => setStatusFilter("aberto")}
          >
            Abertas
          </Button>
          <Button
            variant={statusFilter === "fechado" ? "primary" : "ghost"}
            size="sm"
            borderRadius="full"
            px={6}
            color={statusFilter === "fechado" ? "white" : "brand.light"}
            onClick={() => setStatusFilter("fechado")}
          >
            Fechadas
          </Button>
        </HStack>

        <Flex gap={2} flexWrap="wrap" w={{ base: "100%", md: "auto" }}>
          <InputGroup maxW={{ base: "100%", md: "260px" }} flex={{ base: "1 1 100%", md: "unset" }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Buscar comanda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="brand.surface"
              color="brand.light"
              border="1px solid"
              borderColor="brand.surfaceborder"
              borderRadius="full"
              _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px #FF6B00" }}
            />
          </InputGroup>

          <Button
            leftIcon={<FiRefreshCw />}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            variant="outline"
            borderColor="brand.surfaceborder"
            color="brand.light"
            _hover={{ bg: "whiteAlpha.200", borderColor: "brand.secondary" }}
            borderRadius="full"
            size={{ base: "sm", md: "md" }}
          >
            Atualizar
          </Button>

          <Button
            as={RouterLink}
            to="/novo-pedido"
            variant="primary"
            borderRadius="full"
            leftIcon={<FiPlus />}
            size={{ base: "sm", md: "md" }}
          >
            Nova Comanda
          </Button>
        </Flex>
      </Flex>

      <Box
        bg="whiteAlpha.50"
        border="1px solid"
        borderColor="brand.surfaceborder"
        borderRadius="2xl"
        p={{ base: 3, md: 6 }}
        minH="400px"
      >
        {isRefreshing ? (
          <Flex justify="center" align="center" h="100%" py={20}>
            <Spinner color="brand.primary" size="xl" thickness="4px" />
          </Flex>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <VStack spacing={3} align="stretch">
            {filteredPedidos.length > 0 ? (
              filteredPedidos.map((pedido) => (
                <MotionBox
                  key={pedido.id}
                  variants={itemVariants}
                  whileHover={{ y: -2, boxShadow: "0 4px 24px rgba(255,107,0,0.15)", transition: { duration: 0.15 } }}
                  bg="whiteAlpha.50"
                  p={4}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  cursor="pointer"
                  onClick={() => handlePedidoClick(pedido)}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  boxShadow="md"
                >
                  <Flex align="flex-start" width="100%" direction="column" gap={2}>
                    {/* Linha superior: ID, cliente, mesa, status, total */}
                    <Flex align="center" width="100%">
                      <Box width={{ base: "70px", md: "110px" }} pl={2} flexShrink={0}>
                        <Text fontWeight="bold" color="brand.secondary" fontSize="lg">
                          #{pedido.id}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {formatarHora(pedido.timestamp)}
                        </Text>
                      </Box>
                      <Box flex="1">
                        <Flex justify="space-between" align="center">
                          <Text color="brand.light" fontWeight="600" fontSize="md">
                            {pedido.cliente} <Text as="span" color="whiteAlpha.400" mx={2}>•</Text> {pedido.mesa}
                          </Text>
                          <Flex align="center" gap={4}>
                            <Badge
                              colorScheme={pedido.status === "aberto" ? "green" : "orange"}
                              fontSize="xs" px={3} py={1} borderRadius="full"
                              textTransform="uppercase" letterSpacing="wider"
                            >
                              {pedido.status === "aberto" ? "Aberta" : "Fechada"}
                            </Badge>
                            <Text fontWeight="bold" color="brand.light" fontSize="lg">
                              R$ {calcularTotal(pedido).toFixed(2)}
                            </Text>
                          </Flex>
                        </Flex>
                      </Box>
                    </Flex>

                    {/* Linha de itens com adicionais/removidos */}
                    <Flex pl={{ base: "70px", md: "110px" }} flexWrap="wrap" gap={2} width="100%">
                      {pedido.itens.map((item, idx) => (
                        <Box
                          key={idx}
                          bg="whiteAlpha.100"
                          borderRadius="md"
                          px={2}
                          py={1}
                          fontSize="xs"
                          border="1px solid"
                          borderColor="whiteAlpha.200"
                        >
                          <Text color="brand.light" fontWeight="600">
                            {item.quantidade}x {item.nome}
                            {item.preco !== (item.precoBase ?? item.preco) && (
                              <Text as="span" color="brand.secondary" ml={1}>
                                R$ {item.preco.toFixed(2)}
                              </Text>
                            )}
                          </Text>
                          {item.adicionais && item.adicionais.length > 0 && (
                            <Flex flexWrap="wrap" gap={1} mt={0.5}>
                              {item.adicionais.map((adic, i) => (
                                <Flex key={i} align="center" gap={0.5}>
                                  <FiPlus color="#48BB78" size={9} />
                                  <Text color="green.300">{adic.nome}</Text>
                                </Flex>
                              ))}
                            </Flex>
                          )}
                          {item.removidos && item.removidos.length > 0 && (
                            <Flex flexWrap="wrap" gap={1} mt={0.5}>
                              {item.removidos.map((rem, i) => (
                                <Flex key={i} align="center" gap={0.5}>
                                  <FiMinus color="#F56565" size={9} />
                                  <Text color="red.300" textDecoration="line-through">{rem}</Text>
                                </Flex>
                              ))}
                            </Flex>
                          )}
                        </Box>
                      ))}
                    </Flex>
                  </Flex>
                </MotionBox>
              ))
            ) : (
              <Flex align="center" justify="center" py={16} flexDir="column" gap={3}>
                <Icon as={FiSearch} color="gray.600" boxSize={10} />
                <Text color="gray.500" fontSize="lg">Nenhuma comanda encontrada</Text>
              </Flex>
            )}
          </VStack>
          </motion.div>
        )}
      </Box>

      {/* Modal de detalhes do pedido */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent bg="brand.darker" borderColor="brand.surfaceborder" borderWidth={1} borderRadius="2xl" overflow="hidden" boxShadow="0 10px 40px rgba(0,0,0,0.5)">
          <ModalHeader color="brand.secondary" borderBottomWidth={1} borderBottomColor="whiteAlpha.100" bg="whiteAlpha.50" pt={5} pb={4}>
            <Flex justify="space-between" align="center">
              <Text fontFamily="'Bubblegum Sans', cursive" fontSize="2xl" letterSpacing="wide">Comanda #{selectedPedido?.id}</Text>
              <Badge
                colorScheme={selectedPedido?.status === "aberto" ? "green" : "orange"}
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
              >
                {selectedPedido?.status === "aberto" ? "Aberta" : "Fechada"}
              </Badge>
            </Flex>
          </ModalHeader>
          <ModalCloseButton color="brand.light" mt={2} />
          <ModalBody py={6} px={8}>
            <VStack align="stretch" spacing={5}>
              <Flex justify="space-between" bg="whiteAlpha.50" p={4} borderRadius="lg">
                <Box>
                  <Text color="gray.400" fontSize="sm">Cliente</Text>
                  <Text color="brand.light" fontWeight="bold" fontSize="lg">
                    {selectedPedido?.cliente}
                  </Text>
                </Box>
                <Box textAlign="right">
                  <Text color="gray.400" fontSize="sm">Mesa</Text>
                  <Text color="brand.light" fontWeight="bold" fontSize="lg">
                    {selectedPedido?.mesa}
                  </Text>
                </Box>
              </Flex>

              <Box>
                <Text color="brand.primary" fontWeight="bold" mb={3} textTransform="uppercase" fontSize="sm" letterSpacing="wider">
                  Itens do Pedido
                </Text>
                <VStack align="stretch" spacing={0}>
                  {selectedPedido?.itens.map((item, index) => (
                    <Box
                      key={index}
                      borderBottom="1px solid"
                      borderColor="whiteAlpha.100"
                      py={3}
                      _last={{ borderBottom: "none" }}
                    >
                      {/* Linha principal do produto */}
                      <Flex justify="space-between" align="center">
                        <Flex align="center" gap={2}>
                          <Badge
                            bg="brand.primary"
                            color="white"
                            fontSize="xs"
                            borderRadius="md"
                            px={2}
                            minW="28px"
                            textAlign="center"
                          >
                            {item.quantidade}x
                          </Badge>
                          <Text color="brand.light" fontWeight="700" fontSize="md">
                            {item.nome}
                          </Text>
                        </Flex>
                        <Text color="brand.secondary" fontWeight="bold" fontSize="md">
                          R$ {(item.preco * item.quantidade).toFixed(2)}
                        </Text>
                      </Flex>

                      {/* Adicionais — subtítulo indentado */}
                      {item.adicionais && item.adicionais.length > 0 && (
                        <Box pl="44px" mt={1}>
                          {item.adicionais.map((adic, i) => (
                            <Flex key={i} align="center" gap={2} mt={0.5}>
                              <FiPlus size={10} color="#68D391" />
                              <Text fontSize="sm" color="green.300">
                                {adic.nome}
                                <Text as="span" color="green.500" ml={1} fontSize="xs">
                                  (+R$ {adic.preco.toFixed(2)})
                                </Text>
                              </Text>
                            </Flex>
                          ))}
                        </Box>
                      )}

                      {/* Removidos — subtítulo indentado */}
                      {item.removidos && item.removidos.length > 0 && (
                        <Box pl="44px" mt={1}>
                          {item.removidos.map((rem, i) => (
                            <Flex key={i} align="center" gap={2} mt={0.5}>
                              <FiMinus size={10} color="#FC8181" />
                              <Text fontSize="sm" color="red.300" textDecoration="line-through">
                                {rem}
                              </Text>
                            </Flex>
                          ))}
                        </Box>
                      )}

                      {/* Observação */}
                      {item.observacao && (
                        <Box pl="44px" mt={1}>
                          <Flex align="center" gap={2}>
                            <FiTag size={10} color="#ECC94B" />
                            <Text fontSize="sm" color="yellow.400" fontStyle="italic">
                              "{item.observacao}"
                            </Text>
                          </Flex>
                        </Box>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>

              <Divider borderColor="whiteAlpha.200" my={2} />

              <Flex justify="space-between" align="center">
                <Text color="gray.300" fontSize="lg">Total da Comanda</Text>
                <Text color="brand.secondary" fontSize="2xl" fontWeight="bold">
                  R$ {selectedPedido ? calcularTotal(selectedPedido).toFixed(2) : "0.00"}
                </Text>
              </Flex>

              <HStack spacing={4} mt={6} justify="space-between">
                <Flex gap={3}>
                  {selectedPedido?.status === "aberto" ? (
                    <Button
                      leftIcon={<FiEdit />}
                      as={RouterLink}
                      to={`/editar-pedido/${selectedPedido?.id}`}
                      variant="outline"
                      color="brand.light"
                      borderColor="brand.surfaceborder"
                      _hover={{ bg: "whiteAlpha.100" }}
                      size="md"
                    >
                      Editar
                    </Button>
                  ) : (
                    <Button
                      leftIcon={<FiEdit />}
                      onClick={() => selectedPedido && reabrirComanda(selectedPedido.id)}
                      variant="outline"
                      color="brand.light"
                      borderColor="brand.surfaceborder"
                      _hover={{ bg: "whiteAlpha.100" }}
                      size="md"
                    >
                      Reabrir
                    </Button>
                  )}

                  <IconButton
                    aria-label="Excluir"
                    icon={<FiTrash2 />}
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => selectedPedido && excluirComanda(selectedPedido.id)}
                  />
                </Flex>

                {selectedPedido?.status === "aberto" ? (
                  <Button
                    leftIcon={<FiCreditCard />}
                    onClick={() => selectedPedido && fecharComanda(selectedPedido.id)}
                    variant="primary"
                    size="md"
                    px={6}
                  >
                    Fechar
                  </Button>
                ) : (
                  <Button
                    leftIcon={<FiCreditCard />}
                    as={RouterLink}
                    to={`/pagamento/${selectedPedido?.id}`}
                    variant="primary"
                    size="md"
                    px={6}
                  >
                    Pagamento
                  </Button>
                )}
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default PedidosPage
