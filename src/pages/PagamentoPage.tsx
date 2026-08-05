"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Box,
  Heading,
  VStack,
  Text,
  Button,
  RadioGroup,
  Radio,
  Flex,
  Input,
  FormControl,
  FormLabel,
  useToast,
  HStack,
  Icon,
  IconButton,
  Divider,
  Badge,
  Grid,
  GridItem,
  Spinner,
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { FiCreditCard, FiDollarSign, FiSmartphone, FiCheck, FiPrinter, FiAlertTriangle, FiArrowLeft, FiPlus, FiMinus, FiTag } from "react-icons/fi"
import { useData, type Pedido, type Venda } from "../context/DataContext"

type MetodoPagamento = "pix" | "dinheiro" | "cartao_credito" | "cartao_debito"

const MotionBox = motion(Box)
const MotionGridItem = motion(GridItem)

const PagamentoPage = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { getPedido, updatePedido, addVenda, pedidos } = useData()

  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("pix")
  const [valorRecebido, setValorRecebido] = useState("")
  const [processando, setProcessando] = useState(false)
  const [pagamentoFinalizado, setPagamentoFinalizado] = useState(false)
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (pedidoId) {
      const pedidoEncontrado = getPedido(Number(pedidoId))

      if (pedidoEncontrado) {
        setPedido(pedidoEncontrado)
        if (pedidoEncontrado.status === "pago") {
          setPagamentoFinalizado(true)
          if (pedidoEncontrado.formaPagamento) {
            setMetodoPagamento(pedidoEncontrado.formaPagamento)
          }
          if (pedidoEncontrado.valorRecebido) {
            setValorRecebido(pedidoEncontrado.valorRecebido.toString())
          }
        }
        setCarregando(false)
      } else {
        setErro("Pedido não encontrado")
        setCarregando(false)
      }
    }
  }, [pedidoId, getPedido])

  const valorTotal = pedido ? pedido.itens.reduce((total, item) => total + item.preco * item.quantidade, 0) : 0

  const calcularTroco = () => {
    if (!valorRecebido) return 0
    const valor = Number.parseFloat(valorRecebido.replace(",", "."))
    return valor > valorTotal ? valor - valorTotal : 0
  }

  const handleFinalizarPagamento = () => {
    if (!pedido) return
    setProcessando(true)

    if (metodoPagamento === "dinheiro" && !valorRecebido) {
      toast({
        title: "Erro",
        description: "Informe o valor recebido",
        status: "error",
        duration: 3000,
      })
      setProcessando(false)
      return
    }

    setTimeout(() => {
      const valorRecebidoNum = valorRecebido ? Number.parseFloat(valorRecebido.replace(",", ".")) : valorTotal
      const trocoCalculado = calcularTroco()

      const pedidoPago: Pedido = {
        ...pedido,
        status: "pago",
        formaPagamento: metodoPagamento,
        valorRecebido: valorRecebidoNum,
        troco: trocoCalculado,
      }

      updatePedido(pedidoPago)

      const novaVenda: Omit<Venda, "id"> = {
        pedidoId: pedido.id,
        valor: valorTotal,
        formaPagamento: metodoPagamento,
        data: new Date(),
        itensVendidos: pedido.itens.map((item) => ({
          nome: item.nome,
          quantidade: item.quantidade,
          valorUnitario: item.preco,
          adicionais: item.adicionais || [],
          removidos: item.removidos || [],
        })),
      }

      addVenda(novaVenda)
      setProcessando(false)
      setPagamentoFinalizado(true)

      toast({
        title: "Pagamento realizado",
        description: `Comanda #${pedidoId} paga!`,
        status: "success",
        duration: 5000,
      })
    }, 1500)
  }

  const imprimirComprovante = () => {
    toast({
      title: "Imprimindo...",
      description: "Enviado para a impressora",
      status: "info",
      duration: 3000,
    })
  }

  const voltarParaPedidos = () => {
    navigate("/pedidos")
  }

  if (carregando) {
    return (
      <Flex justify="center" align="center" height="60vh">
        <Spinner size="xl" color="brand.primary" />
      </Flex>
    )
  }

  if (erro) {
    return (
      <Flex direction="column" justify="center" align="center" height="60vh" gap={4}>
        <Icon as={FiAlertTriangle} color="brand.secondary" boxSize={12} />
        <Heading size="md" color="brand.light">{erro}</Heading>
        <Button onClick={() => navigate("/pedidos")} variant="primary">Voltar para Comandas</Button>
      </Flex>
    )
  }

  if (!pedido) return null

  return (
    <Box maxW="1200px" mx="auto" w="100%">
      <Flex align="center" gap={4} mb={8}>
        <IconButton
          icon={<FiArrowLeft />}
          aria-label="Voltar"
          onClick={voltarParaPedidos}
          variant="ghost"
          isRound
          color="brand.light"
          _hover={{ bg: "whiteAlpha.200" }}
        />
        <Box>
          <Heading size="xl" color="brand.light" fontWeight="700">
            Pagamento
          </Heading>
          <Text color="gray.400" mt={1}>Comanda #{pedidoId}</Text>
        </Box>
      </Flex>

      <Grid templateColumns={{ base: "1fr", lg: "5fr 4fr" }} gap={8}>
        {/* Resumo do pedido */}
        <MotionGridItem initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Box variant="glass" p={{ base: 4, md: 8 }} borderRadius="2xl" height="100%" display="flex" flexDirection="column">
            <Flex justify="space-between" align="center" mb={6}>
              <Flex align="center" gap={3}>
                <Box p={2} bg="whiteAlpha.100" borderRadius="md"><FiPrinter color="#FFD700" /></Box>
                <Heading size="md" color="brand.light">Resumo do Pedido</Heading>
              </Flex>
              <Badge colorScheme={pedido.status === "pago" ? "green" : "orange"} px={3} py={1} borderRadius="full" textTransform="uppercase" letterSpacing="wider">
                {pedido.status === "pago" ? "Pago" : "Pendente"}
              </Badge>
            </Flex>

            <Flex justify="space-between" mb={6} bg="whiteAlpha.50" p={4} borderRadius="lg" border="1px solid" borderColor="brand.surfaceborder">
              <VStack align="start" spacing={1}>
                <Text color="gray.400" fontSize="sm">Cliente</Text>
                <Text color="brand.light" fontWeight="bold" fontSize="lg">{pedido.cliente}</Text>
              </VStack>
              <VStack align="end" spacing={1}>
                <Text color="gray.400" fontSize="sm">Mesa/Local</Text>
                <Text color="brand.light" fontWeight="bold" fontSize="lg">{pedido.mesa}</Text>
              </VStack>
            </Flex>

            <Box flex="1" overflowY="auto" pr={2} sx={{"&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-track": { background: "rgba(255,255,255,0.05)" }, "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.2)", borderRadius: "24px" }}}>
              <VStack align="stretch" spacing={0}>
                {pedido.itens.map((item, index) => (
                  <Box
                    key={index}
                    borderBottom="1px solid"
                    borderColor="whiteAlpha.100"
                    py={3}
                    _last={{ borderBottom: "none" }}
                  >
                    {/* Linha principal: quantidade x nome + valor */}
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
                      <Text color="brand.light" fontWeight="600">
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
                          <Text fontSize="sm" color="gray.400" fontStyle="italic">
                            "{item.observacao}"
                          </Text>
                        </Flex>
                      </Box>
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>

            <Divider borderColor="brand.surfaceborder" my={6} />

            <Flex justify="space-between" align="center" bg="whiteAlpha.100" p={5} borderRadius="xl" border="1px solid" borderColor="brand.primary" boxShadow="0 0 15px rgba(255,107,0,0.1)">
              <Text color="gray.300" fontSize="lg" fontWeight="600">Total a Pagar</Text>
              <Text color="brand.primary" fontSize="3xl" fontWeight="800" sx={{ WebkitTextStroke: "1px rgba(255,107,0,0.2)"}}>
                R$ {valorTotal.toFixed(2)}
              </Text>
            </Flex>
          </Box>
        </MotionGridItem>

        {/* Métodos de pagamento ou Sucesso */}
        <MotionGridItem initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          {!pagamentoFinalizado ? (
            <Box variant="glass" p={{ base: 4, md: 8 }} borderRadius="2xl" height="100%">
              <Heading size="md" mb={6} color="brand.light">
                Forma de Pagamento
              </Heading>

              <RadioGroup value={metodoPagamento} onChange={(value) => setMetodoPagamento(value as MetodoPagamento)}>
                <VStack align="stretch" spacing={4}>
                  <Box
                    as={motion.div}
                    whileHover={{ scale: 1.02 }}
                    p={4}
                    borderWidth="2px"
                    borderRadius="xl"
                    cursor="pointer"
                    onClick={() => setMetodoPagamento("pix")}
                    borderColor={metodoPagamento === "pix" ? "brand.primary" : "brand.surfaceborder"}
                    bg={metodoPagamento === "pix" ? "rgba(255,107,0,0.05)" : "whiteAlpha.100"}
                    transition="all 0.2s"
                  >
                    <Radio value="pix" colorScheme="orange" size="lg" w="100%">
                      <HStack ml={2}>
                        <Icon as={FiSmartphone} boxSize={5} color={metodoPagamento === "pix" ? "brand.primary" : "gray.400"} />
                        <Text color="brand.light" fontWeight={metodoPagamento === "pix" ? "bold" : "normal"}>PIX</Text>
                      </HStack>
                    </Radio>
                  </Box>

                  <Box
                    as={motion.div}
                    whileHover={{ scale: 1.02 }}
                    p={4}
                    borderWidth="2px"
                    borderRadius="xl"
                    cursor="pointer"
                    onClick={() => setMetodoPagamento("dinheiro")}
                    borderColor={metodoPagamento === "dinheiro" ? "brand.primary" : "brand.surfaceborder"}
                    bg={metodoPagamento === "dinheiro" ? "rgba(255,107,0,0.05)" : "whiteAlpha.100"}
                    transition="all 0.2s"
                  >
                    <Radio value="dinheiro" colorScheme="orange" size="lg" w="100%">
                      <HStack ml={2}>
                        <Icon as={FiDollarSign} boxSize={5} color={metodoPagamento === "dinheiro" ? "brand.primary" : "gray.400"} />
                        <Text color="brand.light" fontWeight={metodoPagamento === "dinheiro" ? "bold" : "normal"}>Dinheiro</Text>
                      </HStack>
                    </Radio>

                    {metodoPagamento === "dinheiro" && (
                      <MotionBox initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} mt={4} pl={8} overflow="hidden">
                        <VStack spacing={3} align="stretch">
                          <FormControl>
                            <FormLabel fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider">Valor recebido do cliente</FormLabel>
                            <Input
                              placeholder="0,00"
                              value={valorRecebido}
                              onChange={(e) => setValorRecebido(e.target.value)}
                              color="brand.light"
                              bg="blackAlpha.500"
                              border="1px solid"
                              borderColor="whiteAlpha.200"
                              size="lg"
                              fontSize="xl"
                              fontWeight="bold"
                              _focus={{ borderColor: "brand.primary" }}
                            />
                          </FormControl>

                          {valorRecebido && Number.parseFloat(valorRecebido.replace(",", ".")) > valorTotal && (
                            <Flex justify="space-between" align="center" bg="green.900" p={3} borderRadius="md" borderLeft="4px solid" borderLeftColor="green.400">
                              <Text color="green.100" fontWeight="bold">Troco a devolver</Text>
                              <Text color="green.300" fontWeight="900" fontSize="lg">R$ {calcularTroco().toFixed(2)}</Text>
                            </Flex>
                          )}
                        </VStack>
                      </MotionBox>
                    )}
                  </Box>

                  <Box
                    as={motion.div}
                    whileHover={{ scale: 1.02 }}
                    p={4}
                    borderWidth="2px"
                    borderRadius="xl"
                    cursor="pointer"
                    onClick={() => setMetodoPagamento("cartao_credito")}
                    borderColor={metodoPagamento === "cartao_credito" ? "brand.primary" : "brand.surfaceborder"}
                    bg={metodoPagamento === "cartao_credito" ? "rgba(255,107,0,0.05)" : "whiteAlpha.100"}
                    transition="all 0.2s"
                  >
                    <Radio value="cartao_credito" colorScheme="orange" size="lg" w="100%">
                      <HStack ml={2}>
                        <Icon as={FiCreditCard} boxSize={5} color={metodoPagamento === "cartao_credito" ? "brand.primary" : "gray.400"} />
                        <Text color="brand.light" fontWeight={metodoPagamento === "cartao_credito" ? "bold" : "normal"}>Cartão de Crédito</Text>
                      </HStack>
                    </Radio>
                  </Box>

                  <Box
                    as={motion.div}
                    whileHover={{ scale: 1.02 }}
                    p={4}
                    borderWidth="2px"
                    borderRadius="xl"
                    cursor="pointer"
                    onClick={() => setMetodoPagamento("cartao_debito")}
                    borderColor={metodoPagamento === "cartao_debito" ? "brand.primary" : "brand.surfaceborder"}
                    bg={metodoPagamento === "cartao_debito" ? "rgba(255,107,0,0.05)" : "whiteAlpha.100"}
                    transition="all 0.2s"
                  >
                    <Radio value="cartao_debito" colorScheme="orange" size="lg" w="100%">
                      <HStack ml={2}>
                        <Icon as={FiCreditCard} boxSize={5} color={metodoPagamento === "cartao_debito" ? "brand.primary" : "gray.400"} />
                        <Text color="brand.light" fontWeight={metodoPagamento === "cartao_debito" ? "bold" : "normal"}>Cartão de Débito</Text>
                      </HStack>
                    </Radio>
                  </Box>
                </VStack>
              </RadioGroup>

              <Button
                mt={8}
                w="100%"
                variant="primary"
                size="lg"
                height="60px"
                fontSize="lg"
                onClick={handleFinalizarPagamento}
                isLoading={processando}
                loadingText="Processando..."
                boxShadow="0 10px 25px rgba(255,107,0,0.4)"
                _hover={{ transform: "translateY(-2px)", boxShadow: "0 15px 35px rgba(255,107,0,0.5)" }}
              >
                Confirmar Recebimento
              </Button>
            </Box>
          ) : (
            <MotionBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              variant="glass" 
              p={8} 
              borderRadius="2xl" 
              height="100%"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              textAlign="center"
              position="relative"
              overflow="hidden"
            >
              <Box position="absolute" top="-100px" right="-100px" w="300px" h="300px" bg="green.500" filter="blur(150px)" opacity={0.2} borderRadius="full" />
              
              <MotionBox
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                bg="linear-gradient(135deg, #48BB78 0%, #2F855A 100%)"
                w="100px" h="100px" borderRadius="full" 
                display="flex" alignItems="center" justifyContent="center"
                mb={6}
                boxShadow="0 10px 30px rgba(72,187,120,0.4)"
              >
                <Icon as={FiCheck} boxSize={12} color="white" />
              </MotionBox>
              
              <Heading size="lg" color="white" mb={2}>Pagamento Aprovado!</Heading>
              <Text color="gray.400" mb={8}>A comanda #{pedidoId} foi liquidada com sucesso.</Text>
              
              <Box bg="whiteAlpha.100" p={5} borderRadius="xl" w="100%" mb={5} border="1px solid" borderColor="whiteAlpha.200">
                <Flex justify="space-between" mb={3}>
                  <Text color="gray.400">Método Usado</Text>
                  <Text color="white" fontWeight="bold">
                    {metodoPagamento === "pix" && "PIX"}
                    {metodoPagamento === "dinheiro" && "Dinheiro"}
                    {metodoPagamento === "cartao_credito" && "Cartão de Crédito"}
                    {metodoPagamento === "cartao_debito" && "Cartão de Débito"}
                  </Text>
                </Flex>
                <Flex justify="space-between" mb={3}>
                  <Text color="gray.400">Valor Pago</Text>
                  <Text color="brand.secondary" fontWeight="bold">R$ {valorTotal.toFixed(2)}</Text>
                </Flex>
                <Flex justify="space-between" mb={3}>
                  <Text color="gray.400">Data/Hora</Text>
                  <Text color="white" fontWeight="bold">{new Date().toLocaleString("pt-BR")}</Text>
                </Flex>
                {pedido.troco ? (
                  <>
                    <Divider borderColor="whiteAlpha.200" my={3} />
                    <Flex justify="space-between">
                      <Text color="brand.secondary">Troco Entregue</Text>
                      <Text color="brand.secondary" fontWeight="bold">R$ {pedido.troco.toFixed(2)}</Text>
                    </Flex>
                  </>
                ) : null}
              </Box>

              <Box bg="whiteAlpha.50" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100" w="100%" mb={5}>
                <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider" mb={4} textAlign="center">
                  Comprovante Digital (QR Code)
                </Text>
                <Flex justify="center">
                  <Box bg="white" p={4} borderRadius="2xl" display="inline-block" boxShadow="0 0 30px rgba(255,107,0,0.2)">
                    <QRCodeSVG
                      value={(() => {
                        const comprovanteData = {
                          estabelecimento: "Hot Dog Station",
                          comanda: `#${pedidoId}`,
                          cliente: pedido.cliente,
                          mesa: pedido.mesa,
                          valor: `R$ ${valorTotal.toFixed(2)}`,
                          pagamento: metodoPagamento,
                          dataHora: new Date().toLocaleString("pt-BR"),
                          itens: pedido.itens.map((i) => `${i.quantidade}x ${i.nome}`),
                        }
                        const encoded = btoa(encodeURIComponent(JSON.stringify(comprovanteData)))
                        return `${window.location.origin}/comprovante?data=${encoded}`
                      })()}
                      size={220}
                      level="M"
                    />
                  </Box>
                </Flex>
                <Text color="gray.500" fontSize="sm" textAlign="center" mt={3}>
                  📱 Escaneie para baixar o comprovante
                </Text>
              </Box>

              <HStack spacing={4} w="100%">
                <Button leftIcon={<FiPrinter />} onClick={imprimirComprovante} flex={1} variant="outline" color="brand.secondary" borderColor="brand.surfaceborder" _hover={{ bg: "whiteAlpha.100" }}>
                  Comprovante
                </Button>
                <Button onClick={voltarParaPedidos} flex={1} variant="primary">
                  Concluir
                </Button>
              </HStack>
            </MotionBox>
          )}
        </MotionGridItem>
      </Grid>
    </Box>
  )
}

export default PagamentoPage
