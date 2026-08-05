import { useState, useMemo } from "react"
import {
  Box, Text, Badge, Input, Select, Flex, Icon, Divider, VStack,
  InputGroup, InputLeftElement, Accordion, AccordionItem,
  AccordionButton, AccordionPanel, AccordionIcon, Grid, GridItem,
} from "@chakra-ui/react"
import { FiSearch, FiShoppingBag, FiDollarSign, FiClock, FiFilter } from "react-icons/fi"
import { motion, Variants } from "framer-motion"
import { useData } from "../context/DataContext"

const MotionBox = motion(Box)
const MotionGridItem = motion(GridItem)

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pago:      { label: "Pago",      color: "green"  },
  fechado:   { label: "Fechado",   color: "orange" },
  aberto:    { label: "Aberto",    color: "blue"   },
  cancelado: { label: "Cancelado", color: "red"    },
}

const metodoPagamentoLabel: Record<string, string> = {
  pix:            "PIX",
  dinheiro:       "Dinheiro",
  cartao_credito: "Cartão de Crédito",
  cartao_debito:  "Cartão de Débito",
}

const HistoricoPage = () => {
  const { pedidos } = useData()
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")

  const pedidosFiltrados = useMemo(() => {
    return [...pedidos]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .filter((p) => {
        const matchBusca =
          !busca ||
          p.cliente.toLowerCase().includes(busca.toLowerCase()) ||
          String(p.id).includes(busca)
        const matchStatus = !filtroStatus || p.status === filtroStatus
        return matchBusca && matchStatus
      })
  }, [pedidos, busca, filtroStatus])

  const totalPago = pedidosFiltrados
    .filter((p) => p.status === "pago")
    .reduce((sum, p) => sum + p.itens.reduce((s, i) => s + i.preco * i.quantidade, 0), 0)

  const qtdPago = pedidosFiltrados.filter((p) => p.status === "pago").length

  const kpiCards = [
    {
      label: "Comandas Encontradas",
      value: pedidosFiltrados.length,
      helpText: "No filtro atual",
      icon: FiShoppingBag,
      color: "blue.400",
    },
    {
      label: "Total Arrecadado",
      value: `R$ ${totalPago.toFixed(2)}`,
      helpText: `${qtdPago} comandas pagas`,
      icon: FiDollarSign,
      color: "brand.secondary",
    },
  ]

  return (
    <Box maxW="1000px" mx="auto" w="100%">
      {/* Header */}
      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700" color="brand.light">
            Histórico de Comandas
          </Text>
          <Text color="gray.400" mt={1} fontSize={{ base: "sm", md: "md" }}>
            Todas as comandas registradas no sistema
          </Text>
        </Box>
      </Flex>

      {/* KPI Cards */}
      <motion.div variants={container} initial="hidden" animate="visible">
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={5} mb={8}>
          {kpiCards.map((card, i) => (
            <MotionGridItem key={i} variants={item} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Box
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="brand.surfaceborder"
                p={6}
                borderRadius="2xl"
                position="relative"
                overflow="hidden"
                role="group"
              >
                <Box
                  position="absolute"
                  top="-20px"
                  right="-20px"
                  opacity={0.05}
                  _groupHover={{ opacity: 0.1 }}
                  transition="opacity 0.3s"
                >
                  <Icon as={card.icon} boxSize="130px" color={card.color} />
                </Box>
                <Text color="gray.400" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="wider" mb={2}>
                  {card.label}
                </Text>
                <Text color="brand.light" fontSize="4xl" fontWeight="700" lineHeight={1} mb={2}>
                  {card.value}
                </Text>
                <Flex align="center" gap={2}>
                  <Icon as={card.icon} color={card.color} boxSize={4} />
                  <Text color={card.color} fontSize="sm" fontWeight="500">{card.helpText}</Text>
                </Flex>
              </Box>
            </MotionGridItem>
          ))}
        </Grid>

        {/* Filtros */}
        <MotionBox variants={item} mb={6}>
          <Box
            bg="whiteAlpha.50"
            border="1px solid"
            borderColor="brand.surfaceborder"
            borderRadius="2xl"
            p={4}
          >
            <Flex gap={3} flexWrap="wrap" align="center">
              <Icon as={FiFilter} color="gray.400" />
              <InputGroup maxW={{ base: "100%", md: "320px" }} flex="1">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Buscar por cliente ou #comanda"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  bg="transparent"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  borderRadius="full"
                  _placeholder={{ color: "gray.500" }}
                  _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px #FF6B00" }}
                />
              </InputGroup>
              <Select
                maxW={{ base: "100%", md: "200px" }}
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                bg="transparent"
                border="1px solid"
                borderColor="whiteAlpha.200"
                color="white"
                borderRadius="full"
                _focus={{ borderColor: "brand.primary" }}
              >
                <option value="" style={{ background: "#16213e" }}>Todos os status</option>
                <option value="pago"    style={{ background: "#16213e" }}>Pago</option>
                <option value="fechado" style={{ background: "#16213e" }}>Fechado</option>
                <option value="aberto"  style={{ background: "#16213e" }}>Aberto</option>
              </Select>
            </Flex>
          </Box>
        </MotionBox>

        {/* Lista */}
        {pedidosFiltrados.length === 0 ? (
          <MotionBox variants={item}>
            <Flex
              align="center" justify="center" py={20} flexDir="column" gap={4}
              bg="whiteAlpha.50" border="1px solid" borderColor="brand.surfaceborder"
              borderRadius="2xl"
            >
              <Icon as={FiClock} color="gray.600" boxSize={12} />
              <Text color="gray.500" fontSize="lg">Nenhuma comanda encontrada</Text>
            </Flex>
          </MotionBox>
        ) : (
          <Accordion allowMultiple>
            <motion.div variants={container} initial="hidden" animate="visible">
              {pedidosFiltrados.map((pedido, idx) => {
                const total = pedido.itens.reduce((s, i) => s + i.preco * i.quantidade, 0)
                const cfg = statusConfig[pedido.status] ?? { label: pedido.status, color: "gray" }
                const data = pedido.timestamp ? new Date(pedido.timestamp).toLocaleString("pt-BR") : "—"

                return (
                  <MotionBox
                    key={pedido.id}
                    variants={item}
                    mb={3}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  >
                    <AccordionItem
                      border="1px solid"
                      borderColor="brand.surfaceborder"
                      borderRadius="2xl"
                      overflow="hidden"
                      bg="whiteAlpha.50"
                    >
                      <AccordionButton
                        _hover={{ bg: "whiteAlpha.100" }}
                        p={5}
                        _expanded={{ bg: "whiteAlpha.100", borderBottomWidth: 1, borderBottomColor: "whiteAlpha.100" }}
                      >
                        <Flex flex={1} align="center" gap={3} flexWrap="wrap" textAlign="left">
                          <Text color="brand.primary" fontWeight="bold" minW="55px" fontSize="md">
                            #{pedido.id}
                          </Text>
                          <Text color="white" fontWeight="600" flex={1} fontSize="md">
                            {pedido.cliente}
                          </Text>
                          {pedido.mesa && (
                            <Text color="gray.500" fontSize="xs" bg="whiteAlpha.100" px={2} py={1} borderRadius="md">
                              Mesa {pedido.mesa}
                            </Text>
                          )}
                          <Badge colorScheme={cfg.color} borderRadius="full" px={3} py={1} fontSize="xs">
                            {cfg.label}
                          </Badge>
                          <Text color="brand.secondary" fontWeight="bold" fontSize="lg">
                            R$ {total.toFixed(2)}
                          </Text>
                          <Text color="gray.500" fontSize="xs" display={{ base: "none", md: "block" }}>
                            {data}
                          </Text>
                        </Flex>
                        <AccordionIcon color="gray.400" ml={2} />
                      </AccordionButton>

                      <AccordionPanel bg="rgba(255,255,255,0.02)" p={5}>
                        <VStack align="stretch" spacing={2}>
                          <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider" mb={1}>
                            Itens do Pedido
                          </Text>
                          {pedido.itens.map((it, i) => (
                            <Flex key={i} justify="space-between" align="center" py={1}>
                              <Text color="gray.300" fontSize="sm">
                                <Text as="span" color="brand.primary" fontWeight="bold">{it.quantidade}x</Text>
                                {" "}{it.nome}
                              </Text>
                              <Text color="gray.400" fontSize="sm">R$ {(it.preco * it.quantidade).toFixed(2)}</Text>
                            </Flex>
                          ))}

                          <Divider borderColor="whiteAlpha.100" my={2} />

                          {pedido.formaPagamento && (
                            <Flex justify="space-between">
                              <Text color="gray.400" fontSize="sm">Forma de pagamento</Text>
                              <Text color="white" fontSize="sm">{metodoPagamentoLabel[pedido.formaPagamento] ?? pedido.formaPagamento}</Text>
                            </Flex>
                          )}
                          {pedido.troco != null && pedido.troco > 0 && (
                            <Flex justify="space-between">
                              <Text color="gray.400" fontSize="sm">Troco</Text>
                              <Text color="green.300" fontSize="sm">R$ {pedido.troco.toFixed(2)}</Text>
                            </Flex>
                          )}
                          <Flex justify="space-between" mt={1}>
                            <Text color="white" fontWeight="bold">Total</Text>
                            <Text color="brand.primary" fontWeight="bold" fontSize="lg">R$ {total.toFixed(2)}</Text>
                          </Flex>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  </MotionBox>
                )
              })}
            </motion.div>
          </Accordion>
        )}
      </motion.div>
    </Box>
  )
}

export default HistoricoPage
