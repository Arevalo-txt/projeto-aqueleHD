import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { Box, VStack, Text, Button, Divider, Flex, Icon, Spinner } from "@chakra-ui/react"
import { FiDownload, FiCheckCircle, FiAlertCircle } from "react-icons/fi"
import html2canvas from "html2canvas"

interface ComprovanteData {
  estabelecimento: string
  comanda: string
  cliente: string
  mesa?: string
  valor: string
  pagamento: string
  dataHora: string
  itens: string[]
}

const metodoPagamentoLabel: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
}

const ComprovantePage = () => {
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<ComprovanteData | null>(null)
  const [invalido, setInvalido] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const comprovanteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const encoded = searchParams.get("data")
    if (!encoded) { setInvalido(true); return }
    try {
      const decoded: ComprovanteData = JSON.parse(decodeURIComponent(atob(encoded)))
      setData(decoded)
    } catch {
      setInvalido(true)
    }
  }, [searchParams])

  const salvarImagem = async () => {
    if (!comprovanteRef.current) return
    setSalvando(true)
    try {
      const canvas = await html2canvas(comprovanteRef.current, {
        backgroundColor: "#16213e",
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement("a")
      link.download = `comprovante-${data?.comanda?.replace("#", "") ?? "hotdog"}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } finally {
      setSalvando(false)
    }
  }

  if (!data && !invalido) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="#0f0f1a">
        <Spinner color="orange.400" size="xl" />
      </Flex>
    )
  }

  if (invalido) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="#0f0f1a" p={4}>
        <VStack spacing={3} textAlign="center">
          <Icon as={FiAlertCircle} color="red.400" boxSize={10} />
          <Text color="white" fontWeight="bold" fontSize="lg">Comprovante inválido</Text>
          <Text color="gray.400" fontSize="sm">Este QR code não é válido ou expirou.</Text>
        </VStack>
      </Flex>
    )
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#0f0f1a" p={4} flexDir="column">
      <VStack spacing={4} w="full" maxW="360px">
        {/* Card do comprovante — capturado pelo html2canvas */}
        <Box
          ref={comprovanteRef}
          bg="#16213e"
          borderRadius="2xl"
          p={6}
          w="full"
          border="1px solid rgba(255,255,255,0.08)"
        >
          {/* Header */}
          <VStack spacing={1} mb={5} textAlign="center">
            <Text fontSize="3xl" lineHeight="1">🌭</Text>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="white"
              letterSpacing="wide"
            >
              Hot Dog Station
            </Text>
            <Flex align="center" gap={2} color="#48bb78" mt={1}>
              <Icon as={FiCheckCircle} boxSize={4} />
              <Text fontSize="sm" fontWeight="semibold">Pagamento Confirmado</Text>
            </Flex>
          </VStack>

          <Divider borderColor="rgba(255,255,255,0.1)" mb={4} />

          {/* Dados do pedido */}
          <VStack spacing={2} align="stretch" mb={4}>
            <Flex justify="space-between" align="center">
              <Text color="#9ca3af" fontSize="sm">Comanda</Text>
              <Text color="#ff6b00" fontWeight="bold" fontSize="lg">{data!.comanda}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="#9ca3af" fontSize="sm">Cliente</Text>
              <Text color="white" fontWeight="semibold">{data!.cliente}</Text>
            </Flex>
            {data!.mesa && (
              <Flex justify="space-between" align="center">
                <Text color="#9ca3af" fontSize="sm">Mesa</Text>
                <Text color="white">{data!.mesa}</Text>
              </Flex>
            )}
            <Flex justify="space-between" align="center">
              <Text color="#9ca3af" fontSize="sm">Pagamento</Text>
              <Text color="white">{metodoPagamentoLabel[data!.pagamento] ?? data!.pagamento}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="#9ca3af" fontSize="sm">Data/Hora</Text>
              <Text color="#d1d5db" fontSize="xs">{data!.dataHora}</Text>
            </Flex>
          </VStack>

          <Divider borderColor="rgba(255,255,255,0.1)" mb={4} />

          {/* Itens */}
          <Text color="#9ca3af" fontSize="xs" textTransform="uppercase" letterSpacing="wider" mb={2}>
            Itens do pedido
          </Text>
          <VStack align="stretch" spacing={1} mb={4}>
            {data!.itens.map((item, i) => (
              <Text key={i} color="#d1d5db" fontSize="sm">• {item}</Text>
            ))}
          </VStack>

          <Divider borderColor="rgba(255,255,255,0.1)" mb={4} />

          {/* Total */}
          <Flex justify="space-between" align="center" mb={5}>
            <Text color="white" fontWeight="bold" fontSize="lg">Total pago</Text>
            <Text color="#ff6b00" fontWeight="bold" fontSize="2xl">{data!.valor}</Text>
          </Flex>

          {/* Rodapé */}
          <Box
            bg="rgba(255,107,0,0.08)"
            border="1px solid rgba(255,107,0,0.2)"
            borderRadius="lg"
            p={3}
            textAlign="center"
          >
            <Text color="#ff6b00" fontSize="xs" fontWeight="semibold">
              Obrigado pela preferência! 🧡
            </Text>
            <Text color="#6b7280" fontSize="xs" mt={1}>
              Guarde este comprovante para referência
            </Text>
          </Box>
        </Box>

        {/* Botão salvar — fora do card para não aparecer na imagem */}
        <Button
          leftIcon={<FiDownload />}
          onClick={salvarImagem}
          isLoading={salvando}
          loadingText="Salvando..."
          bg="#ff6b00"
          color="white"
          _hover={{ bg: "#e55a00" }}
          size="lg"
          w="full"
          borderRadius="xl"
          fontWeight="bold"
        >
          Salvar Comprovante
        </Button>

        <Text color="#4b5563" fontSize="xs" textAlign="center">
          A imagem será salva na galeria do seu celular
        </Text>
      </VStack>
    </Flex>
  )
}

export default ComprovantePage
