"use client"

import { useState, useEffect, useRef } from "react"
import {
  Box,
  Heading,
  Flex,
  Button,
  Select,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  VStack,
  HStack,
  Circle,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  RadioGroup,
  Radio,
  Input,
  FormControl,
  FormLabel,
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { FiTrendingUp, FiDollarSign, FiPieChart, FiBarChart2, FiList, FiDownload } from "react-icons/fi"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line, Doughnut, Bar } from "react-chartjs-2"
import { useData } from "../context/DataContext"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend, Filler)

const MotionBox = motion(Box)
const MotionGridItem = motion(GridItem)

interface DadosFaturamento {
  totalVendas: number
  valorTotal: number
  ticketMedio: number
  formaPagamento: {
    [key: string]: number
  }
  produtosMaisVendidos: Array<{
    nome: string
    quantidade: number
    valor: number
  }>
}

const RelatoriosPage = () => {
  const { vendas } = useData()
  const [periodoSelecionado, setPeriodoSelecionado] = useState<"hoje" | "semana" | "mes" | "total">("semana")
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [exportType, setExportType] = useState<"hoje" | "semana" | "mes" | "dia_especifico" | "periodo">("hoje")
  const [exportDataEspecifica, setExportDataEspecifica] = useState("")
  const [exportDataInicio, setExportDataInicio] = useState("")
  const [exportDataFim, setExportDataFim] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const [dadosFaturamento, setDadosFaturamento] = useState<DadosFaturamento>({
    totalVendas: 0,
    valorTotal: 0,
    ticketMedio: 0,
    formaPagamento: {},
    produtosMaisVendidos: [],
  })
  const [dadosDiarios, setDadosDiarios] = useState<{
    labels: string[]
    valores: number[]
  }>({ labels: [], valores: [] })

  const formatarData = (data: Date): string => {
    const dataObj = new Date(data)
    return dataObj.toLocaleDateString("pt-BR")
  }

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  useEffect(() => {
    if (vendas.length === 0) return

    const dataAtual = new Date()
    const inicioHoje = new Date(dataAtual.setHours(0, 0, 0, 0))

    const vendasFiltradas = vendas.filter((venda) => {
      const dataVenda = new Date(venda.data)
      switch (periodoSelecionado) {
        case "hoje": return dataVenda >= inicioHoje
        case "semana": {
          const inicioSemana = new Date(dataAtual)
          inicioSemana.setDate(dataAtual.getDate() - 7)
          return dataVenda >= inicioSemana
        }
        case "mes": {
          const inicioMes = new Date(dataAtual)
          inicioMes.setDate(dataAtual.getDate() - 30)
          return dataVenda >= inicioMes
        }
        default: return true
      }
    })

    const totalVendas = vendasFiltradas.length
    const valorTotal = vendasFiltradas.reduce((sum, venda) => sum + venda.valor, 0)
    const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0

    const formaPagamento: { [key: string]: number } = {}
    vendasFiltradas.forEach((venda) => {
      if (formaPagamento[venda.formaPagamento]) {
        formaPagamento[venda.formaPagamento] += venda.valor
      } else {
        formaPagamento[venda.formaPagamento] = venda.valor
      }
    })

    const produtosMap = new Map<string, { quantidade: number; valor: number }>()
    vendasFiltradas.forEach((venda) => {
      venda.itensVendidos.forEach((item) => {
        const chave = item.nome
        if (produtosMap.has(chave)) {
          const atual = produtosMap.get(chave)!
          produtosMap.set(chave, {
            quantidade: atual.quantidade + item.quantidade,
            valor: atual.valor + item.valorUnitario * item.quantidade,
          })
        } else {
          produtosMap.set(chave, {
            quantidade: item.quantidade,
            valor: item.valorUnitario * item.quantidade,
          })
        }
      })
    })

    const produtosMaisVendidos = Array.from(produtosMap.entries())
      .map(([nome, { quantidade, valor }]) => ({ nome, quantidade, valor }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    setDadosFaturamento({
      totalVendas,
      valorTotal,
      ticketMedio,
      formaPagamento,
      produtosMaisVendidos,
    })

    if (periodoSelecionado === "semana" || periodoSelecionado === "mes") {
      const diasPeriodo = periodoSelecionado === "semana" ? 7 : 30
      const labels: string[] = []
      const valores: number[] = []

      for (let i = 0; i < diasPeriodo; i++) {
        const data = new Date()
        data.setDate(data.getDate() - i)
        data.setHours(0, 0, 0, 0)
        const dataStr = formatarData(data)
        labels.unshift(dataStr)

        const valorDia = vendasFiltradas
          .filter((venda) => {
            const vendaData = new Date(venda.data)
            vendaData.setHours(0, 0, 0, 0)
            return vendaData.getTime() === data.getTime()
          })
          .reduce((sum, venda) => sum + venda.valor, 0)
        valores.unshift(valorDia)
      }
      setDadosDiarios({ labels, valores })
    }
  }, [periodoSelecionado, vendas])

  const chartColors = [
    "#FF6B00", // brand.primary
    "#FFD700", // brand.secondary
    "#48BB78", // green.400
    "#4299E1", // blue.400
    "#9F7AEA", // purple.400
  ]

  const maxValorDiario = Math.max(...dadosDiarios.valores, 1)
  const maxQuantidadeProduto =
    dadosFaturamento.produtosMaisVendidos.length > 0
      ? Math.max(...dadosFaturamento.produtosMaisVendidos.map((p) => p.quantidade), 1)
      : 1

  const generateDetailedPDF = () => {
    setIsExporting(true)
    
    // Calcular as datas baseadas na seleção do modal
    const dataAtual = new Date()
    let inicioFiltro = new Date(dataAtual.setHours(0, 0, 0, 0))
    let fimFiltro = new Date()
    fimFiltro.setHours(23, 59, 59, 999)

    if (exportType === "semana") {
      inicioFiltro = new Date()
      inicioFiltro.setDate(inicioFiltro.getDate() - 7)
      inicioFiltro.setHours(0, 0, 0, 0)
    } else if (exportType === "mes") {
      inicioFiltro = new Date()
      inicioFiltro.setDate(inicioFiltro.getDate() - 30)
      inicioFiltro.setHours(0, 0, 0, 0)
    } else if (exportType === "dia_especifico" && exportDataEspecifica) {
      inicioFiltro = new Date(exportDataEspecifica + "T00:00:00")
      fimFiltro = new Date(exportDataEspecifica + "T23:59:59")
    } else if (exportType === "periodo" && exportDataInicio && exportDataFim) {
      inicioFiltro = new Date(exportDataInicio + "T00:00:00")
      fimFiltro = new Date(exportDataFim + "T23:59:59")
    }

    // Filtrar dados
    const vendasFiltradas = vendas.filter((venda) => {
      const dataVenda = new Date(venda.data)
      return dataVenda >= inicioFiltro && dataVenda <= fimFiltro
    })

    const totalVendasModal = vendasFiltradas.length
    const valorTotalModal = vendasFiltradas.reduce((sum, v) => sum + v.valor, 0)
    const ticketMedioModal = totalVendasModal > 0 ? valorTotalModal / totalVendasModal : 0

    // Contabilizar formas de pagamento
    const fp: { [key: string]: number } = {}
    vendasFiltradas.forEach(v => {
      fp[v.formaPagamento] = (fp[v.formaPagamento] || 0) + v.valor
    })

    // Contabilizar produtos
    const prodMap = new Map<string, { quantidade: number; valor: number }>()
    vendasFiltradas.forEach(v => {
      v.itensVendidos.forEach(item => {
        const atual = prodMap.get(item.nome) || { quantidade: 0, valor: 0 }
        prodMap.set(item.nome, {
          quantidade: atual.quantidade + item.quantidade,
          valor: atual.valor + item.valorUnitario * item.quantidade
        })
      })
    })
    const produtosArr = Array.from(prodMap.entries())
      .map(([nome, { quantidade, valor }]) => ({ nome, quantidade, valor }))
      .sort((a, b) => b.quantidade - a.quantidade)

    // Criar o PDF
    const doc = new jsPDF()

    // Título e Cabeçalho
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Relatório Detalhado de Operação", 14, 20)
    
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(`Hot Dog Station - Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28)
    doc.text(`Período analisado: ${formatarData(inicioFiltro)} até ${formatarData(fimFiltro)}`, 14, 34)

    // Resumo
    autoTable(doc, {
      startY: 42,
      head: [["Métrica Financeira", "Valor"]],
      body: [
        ["Total de Comandas", totalVendasModal],
        ["Faturamento Total Bruto", formatarValor(valorTotalModal)],
        ["Ticket Médio por Comanda", formatarValor(ticketMedioModal)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [255, 107, 0] } // Laranja brand.primary
    })

    // Tabela Formas Pagamento
    const fpBody = Object.entries(fp).map(([forma, valor]) => {
      const nomeForma = forma === "pix" ? "PIX" : forma === "dinheiro" ? "Dinheiro" : forma === "cartao_credito" ? "Cartão de Crédito" : "Cartão de Débito"
      return [nomeForma, formatarValor(valor)]
    })
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Meio de Pagamento", "Total Arrecadado"]],
      body: fpBody.length > 0 ? fpBody : [["Nenhum", "-"]],
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80] }
    })

    // Produtos Mais Vendidos
    const prodBody = produtosArr.map((p, i) => [
      i + 1,
      p.nome,
      p.quantidade,
      formatarValor(p.valor)
    ])

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Ranking", "Produto Vendido", "Qtd. Vendida", "Receita Gerada"]],
      body: prodBody.length > 0 ? prodBody : [["-", "Sem dados de produtos", "-", "-"]],
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80] }
    })

    // Salvar arquivo e fechar modal
    doc.save(`Relatorio-AqueleHD-${exportType}.pdf`)
    setIsExporting(false)
    onClose()
  }

  return (
    <Box maxW="1400px" mx="auto" w="100%">
      <Flex justify="space-between" align="center" mb={10} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" color="brand.light" fontWeight="700">
            Relatórios
          </Heading>
          <Text color="gray.400" mt={1}>Acompanhe o desempenho do seu negócio.</Text>
        </Box>

        <Flex gap={3} align="center">
          <Select
            bg="brand.surface"
            color="brand.light"
            border="1px solid"
            borderColor="brand.surfaceborder"
            borderRadius="full"
            value={periodoSelecionado}
            onChange={(e) => setPeriodoSelecionado(e.target.value as any)}
            maxW="250px"
            sx={{"& > option":{background:"#0F172A",color:"white"}}}
            _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px #FF6B00" }}
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Últimos 7 dias</option>
            <option value="mes">Últimos 30 dias</option>
            <option value="total">Todo o período</option>
          </Select>
          <Button
            leftIcon={<FiDownload />}
            variant="primary"
            borderRadius="full"
            onClick={onOpen}
          >
            Exportar Detalhado
          </Button>
        </Flex>
      </Flex>

      <Box ref={reportRef} p={{ base: 2, md: 4 }} borderRadius="2xl" bg="brand.darker" mx={0}>
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mb={8}>
        <MotionGridItem initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Box variant="glass" p={6} borderRadius="2xl" position="relative" overflow="hidden">
            <Box position="absolute" top="-20px" right="-20px" opacity={0.1}>
              <Icon as={FiList} boxSize={24} color="brand.primary" />
            </Box>
            <Stat>
              <StatLabel color="gray.400" fontSize="md" fontWeight="medium">Total de Vendas</StatLabel>
              <StatNumber color="brand.light" fontSize="4xl" fontWeight="900" mt={2}>
                {dadosFaturamento.totalVendas}
              </StatNumber>
              <StatHelpText color="brand.primary" fontSize="sm" mt={2} display="flex" alignItems="center" gap={1}>
                <Icon as={FiTrendingUp} />
                {periodoSelecionado === "hoje" && "Hoje"}
                {periodoSelecionado === "semana" && "Nos últimos 7 dias"}
                {periodoSelecionado === "mes" && "Nos últimos 30 dias"}
                {periodoSelecionado === "total" && "Todo o período"}
              </StatHelpText>
            </Stat>
          </Box>
        </MotionGridItem>

        <MotionGridItem initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Box variant="glass" p={6} borderRadius="2xl" position="relative" overflow="hidden">
             <Box position="absolute" top="-20px" right="-20px" opacity={0.1}>
              <Icon as={FiDollarSign} boxSize={24} color="green.400" />
            </Box>
            <Stat>
              <StatLabel color="gray.400" fontSize="md" fontWeight="medium">Faturamento Total</StatLabel>
              <StatNumber color="brand.secondary" fontSize="4xl" fontWeight="900" mt={2} letterSpacing="tight">
                {formatarValor(dadosFaturamento.valorTotal)}
              </StatNumber>
              <StatHelpText color="green.400" fontSize="sm" mt={2}>
                Ticket médio: {formatarValor(dadosFaturamento.ticketMedio)}
              </StatHelpText>
            </Stat>
          </Box>
        </MotionGridItem>

        <MotionGridItem initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Box variant="glass" p={6} borderRadius="2xl" position="relative" overflow="hidden">
            <Box position="absolute" top="-20px" right="-20px" opacity={0.1}>
              <Icon as={FiPieChart} boxSize={24} color="blue.400" />
            </Box>
            <Stat>
              <StatLabel color="gray.400" fontSize="md" fontWeight="medium">Método Mais Usado</StatLabel>
              <StatNumber color="brand.light" fontSize="4xl" fontWeight="900" mt={2}>
                {Object.entries(dadosFaturamento.formaPagamento).sort((a, b) => b[1] - a[1])[0]?.[0] === "pix"
                  ? "PIX"
                  : Object.entries(dadosFaturamento.formaPagamento).sort((a, b) => b[1] - a[1])[0]?.[0] === "dinheiro"
                    ? "Dinheiro"
                    : Object.entries(dadosFaturamento.formaPagamento).sort((a, b) => b[1] - a[1])[0]?.[0] === "cartao_credito"
                      ? "Crédito"
                      : Object.entries(dadosFaturamento.formaPagamento).sort((a, b) => b[1] - a[1])[0]?.[0] === "cartao_debito"
                        ? "Débito"
                        : "N/A"}
              </StatNumber>
              <StatHelpText color="blue.400" fontSize="sm" mt={2}>
                {formatarValor(
                  Object.entries(dadosFaturamento.formaPagamento).sort((a, b) => b[1] - a[1])[0]?.[1] || 0,
                )} recebidos
              </StatHelpText>
            </Stat>
          </Box>
        </MotionGridItem>
      </Grid>

      <Box variant="glass" borderRadius="2xl" overflow="hidden">
        <Tabs variant="soft-rounded" colorScheme="orange" p={4}>
          <TabList bg="whiteAlpha.50" p={2} borderRadius="xl" display="inline-flex" mb={4} border="1px solid" borderColor="brand.surfaceborder">
            <Tab color="gray.400" _selected={{ bg: "brand.primary", color: "white", boxShadow: "md" }} borderRadius="lg" px={6}>Visão Geral</Tab>
            <Tab color="gray.400" _selected={{ bg: "brand.primary", color: "white", boxShadow: "md" }} borderRadius="lg" px={6}>Produtos</Tab>
            <Tab color="gray.400" _selected={{ bg: "brand.primary", color: "white", boxShadow: "md" }} borderRadius="lg" px={6}>Histórico</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={8}>
                <GridItem>
                  <Box bg="whiteAlpha.50" p={6} borderRadius="xl" border="1px solid" borderColor="brand.surfaceborder" height="100%">
                    <Flex align="center" gap={3} mb={6}>
                      <Box p={2} bg="brand.primary" borderRadius="md" opacity={0.8}><FiBarChart2 color="white" /></Box>
                      <Heading size="md" color="brand.light">Faturamento Diário</Heading>
                    </Flex>
                    {dadosDiarios.labels.length > 0 ? (
                      <Box h="260px">
                        <Line
                          data={{
                            labels: dadosDiarios.labels,
                            datasets: [{
                              label: "Faturamento (R$)",
                              data: dadosDiarios.valores,
                              borderColor: "#FF6B00",
                              backgroundColor: "rgba(255,107,0,0.12)",
                              pointBackgroundColor: "#FF6B00",
                              pointBorderColor: "#fff",
                              pointRadius: 4,
                              tension: 0.4,
                              fill: true,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: (ctx) => `R$ ${Number(ctx.raw).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                                },
                              },
                            },
                            scales: {
                              x: {
                                ticks: { color: "#94A3B8", maxTicksLimit: 7, font: { size: 10 } },
                                grid: { color: "rgba(255,255,255,0.05)" },
                              },
                              y: {
                                ticks: { color: "#94A3B8", callback: (v) => `R$${Number(v).toFixed(0)}` },
                                grid: { color: "rgba(255,255,255,0.05)" },
                              },
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <Flex justify="center" align="center" h="200px">
                        <Text color="gray.500">Nenhum dado disponível para o período selecionado.</Text>
                      </Flex>
                    )}
                  </Box>
                </GridItem>

                <GridItem>
                  <Box bg="whiteAlpha.50" p={6} borderRadius="xl" border="1px solid" borderColor="brand.surfaceborder" height="100%">
                    <Flex align="center" gap={3} mb={6}>
                      <Box p={2} bg="blue.500" borderRadius="md" opacity={0.8}><FiPieChart color="white" /></Box>
                      <Heading size="md" color="brand.light">Formas de Pagamento</Heading>
                    </Flex>
                    {Object.keys(dadosFaturamento.formaPagamento).length > 0 ? (
                      <Flex direction="column" align="center" gap={4}>
                        <Box h="200px" w="200px">
                          <Doughnut
                            data={{
                              labels: Object.keys(dadosFaturamento.formaPagamento).map((f) =>
                                f === "pix" ? "PIX" : f === "dinheiro" ? "Dinheiro" : f === "cartao_credito" ? "Crédito" : "Débito"
                              ),
                              datasets: [{
                                data: Object.values(dadosFaturamento.formaPagamento),
                                backgroundColor: chartColors,
                                borderColor: "#0B1120",
                                borderWidth: 3,
                              }],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              cutout: "68%",
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  callbacks: {
                                    label: (ctx) => ` R$ ${Number(ctx.raw).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                                  },
                                },
                              },
                            }}
                          />
                        </Box>
                        <VStack spacing={2} align="stretch" w="100%">
                          {Object.entries(dadosFaturamento.formaPagamento).sort((a, b) => b[1] - a[1]).map(([forma, valor], idx) => {
                            const total = Object.values(dadosFaturamento.formaPagamento).reduce((a, b) => a + b, 0)
                            const pct = ((valor / total) * 100).toFixed(1)
                            return (
                              <Flex key={idx} justify="space-between" align="center">
                                <HStack>
                                  <Circle size="8px" bg={chartColors[idx % chartColors.length]} />
                                  <Text color="brand.light" fontSize="sm">
                                    {forma === "pix" ? "PIX" : forma === "dinheiro" ? "Dinheiro" : forma === "cartao_credito" ? "Cartão de Crédito" : "Cartão de Débito"}
                                  </Text>
                                </HStack>
                                <Text color="gray.400" fontSize="sm">{formatarValor(valor)} ({pct}%)</Text>
                              </Flex>
                            )
                          })}
                        </VStack>
                      </Flex>
                    ) : (
                      <Flex justify="center" align="center" h="200px">
                        <Text color="gray.500">Nenhum dado.</Text>
                      </Flex>
                    )}
                  </Box>
                </GridItem>
              </Grid>
            </TabPanel>

            <TabPanel>
              <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
                <GridItem>
                  <Box bg="whiteAlpha.50" p={6} borderRadius="xl" border="1px solid" borderColor="brand.surfaceborder" height="100%">
                    <Heading size="md" color="brand.light" mb={6}>Mais Vendidos</Heading>
                    {dadosFaturamento.produtosMaisVendidos.length > 0 ? (
                      <Box h="320px">
                        <Bar
                          data={{
                            labels: dadosFaturamento.produtosMaisVendidos.slice(0, 7).map((p) =>
                              p.nome.length > 16 ? p.nome.substring(0, 14) + "…" : p.nome
                            ),
                            datasets: [{
                              label: "Unidades vendidas",
                              data: dadosFaturamento.produtosMaisVendidos.slice(0, 7).map((p) => p.quantidade),
                              backgroundColor: chartColors.map((c) => c + "CC"),
                              borderColor: chartColors,
                              borderWidth: 2,
                              borderRadius: 6,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            indexAxis: "y" as const,
                            plugins: {
                              legend: { display: false },
                              tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} unidades` } },
                            },
                            scales: {
                              x: {
                                ticks: { color: "#94A3B8" },
                                grid: { color: "rgba(255,255,255,0.05)" },
                              },
                              y: {
                                ticks: { color: "#E2E8F0", font: { size: 11 } },
                                grid: { display: false },
                              },
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <Flex justify="center" align="center" h="200px">
                        <Text color="gray.500">Nenhum dado.</Text>
                      </Flex>
                    )}
                  </Box>
                </GridItem>

                <GridItem>
                  <Box bg="whiteAlpha.50" p={6} borderRadius="xl" border="1px solid" borderColor="brand.surfaceborder" height="100%">
                    <Heading size="md" color="brand.light" mb={6}>Detalhamento</Heading>
                    {dadosFaturamento.produtosMaisVendidos.length > 0 ? (
                      <Box overflowX="auto">
                        <Table size="sm" variant="unstyled">
                          <Thead borderBottom="1px solid" borderColor="whiteAlpha.200">
                            <Tr>
                              <Th color="gray.400" py={3}>Produto</Th>
                              <Th color="gray.400" py={3} isNumeric>Quant.</Th>
                              <Th color="gray.400" py={3} isNumeric>Receita</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {dadosFaturamento.produtosMaisVendidos.map((produto, idx) => (
                              <Tr key={idx} borderBottom="1px dashed" borderColor="whiteAlpha.100">
                                <Td color="white" py={3} fontWeight="medium">{produto.nome}</Td>
                                <Td color="gray.300" py={3} isNumeric>{produto.quantidade}</Td>
                                <Td color="brand.secondary" py={3} isNumeric fontWeight="bold">{formatarValor(produto.valor)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    ) : (
                      <Flex justify="center" align="center" h="200px">
                        <Text color="gray.500">Nenhum dado.</Text>
                      </Flex>
                    )}
                  </Box>
                </GridItem>
              </Grid>
            </TabPanel>

            <TabPanel>
              <Box bg="whiteAlpha.50" p={6} borderRadius="xl" border="1px solid" borderColor="brand.surfaceborder">
                <Heading size="md" color="brand.light" mb={6}>Registros Recentes</Heading>
                {vendas.length > 0 ? (
                  <Box overflowX="auto">
                    <Table size="sm" variant="unstyled">
                      <Thead borderBottom="1px solid" borderColor="whiteAlpha.200">
                        <Tr>
                          <Th color="gray.400" py={4}>Data</Th>
                          <Th color="gray.400" py={4}>Comanda</Th>
                          <Th color="gray.400" py={4}>Forma Fgto</Th>
                          <Th color="gray.400" py={4}>Itens</Th>
                          <Th color="gray.400" py={4} isNumeric>Valor</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {vendas
                          .filter((venda) => {
                            const dataVenda = new Date(venda.data)
                            const dataAtual = new Date()
                            const inicioHoje = new Date(dataAtual.setHours(0, 0, 0, 0))

                            switch (periodoSelecionado) {
                              case "hoje": return dataVenda >= inicioHoje
                              case "semana": {
                                const inicioSemana = new Date(dataAtual)
                                inicioSemana.setDate(dataAtual.getDate() - 7)
                                return dataVenda >= inicioSemana
                              }
                              case "mes": {
                                const inicioMes = new Date(dataAtual)
                                inicioMes.setDate(dataAtual.getDate() - 30)
                                return dataVenda >= inicioMes
                              }
                              default: return true
                            }
                          })
                          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                          .slice(0, 50)
                          .map((venda, index) => (
                            <MotionTr 
                              key={venda.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              borderBottom="1px solid" borderColor="whiteAlpha.50" _hover={{ bg: "whiteAlpha.50" }}
                            >
                              <Td color="gray.300" py={4}>{formatarData(venda.data)}</Td>
                              <Td color="white" py={4} fontWeight="bold">#{venda.pedidoId}</Td>
                              <Td color="white" py={4}>
                                <Badge
                                  colorScheme={
                                    venda.formaPagamento === "pix" ? "purple" : venda.formaPagamento === "dinheiro" ? "green" : venda.formaPagamento === "cartao_credito" ? "blue" : "cyan"
                                  }
                                  px={2} py={1} borderRadius="md" textTransform="uppercase"
                                >
                                  {venda.formaPagamento === "pix" ? "PIX" : venda.formaPagamento === "dinheiro" ? "Dinheiro" : venda.formaPagamento === "cartao_credito" ? "Crédito" : "Débito"}
                                </Badge>
                              </Td>
                              <Td color="gray.400" py={4}>{venda.itensVendidos.reduce((acc, item) => acc + item.quantidade, 0)}</Td>
                              <Td color="brand.secondary" py={4} isNumeric fontWeight="bold">
                                {formatarValor(venda.valor)}
                              </Td>
                            </MotionTr>
                          ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Flex justify="center" align="center" h="200px">
                    <Text color="gray.500">Nenhum dado.</Text>
                  </Flex>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      </Box>

      {/* MODAL DE EXPORTAÇÃO */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.700" />
        <ModalContent bg="brand.surface" border="1px solid" borderColor="brand.surfaceborder" borderRadius="2xl">
          <ModalHeader color="brand.light" borderBottom="1px solid" borderColor="whiteAlpha.100">Exportar Relatório em PDF</ModalHeader>
          <ModalCloseButton color="brand.light" />
          <ModalBody py={6}>
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel color="gray.400" mb={3}>Selecione o filtro de datas que deseja exportar com precisão:</FormLabel>
                <RadioGroup value={exportType} onChange={(v: any) => setExportType(v)} colorScheme="orange">
                  <VStack align="start" spacing={3}>
                    <Radio value="hoje"><Text color="brand.light">Apenas Hoje</Text></Radio>
                    <Radio value="semana"><Text color="brand.light">Últimos 7 dias</Text></Radio>
                    <Radio value="mes"><Text color="brand.light">Últimos 30 dias</Text></Radio>
                    <Radio value="dia_especifico"><Text color="brand.light">Um dia específico</Text></Radio>
                    <Radio value="periodo"><Text color="brand.light">Período personalizado</Text></Radio>
                  </VStack>
                </RadioGroup>
              </FormControl>

              {exportType === "dia_especifico" && (
                <FormControl>
                  <FormLabel color="gray.400">Data Desejada</FormLabel>
                  <Input type="date" value={exportDataEspecifica} onChange={e => setExportDataEspecifica(e.target.value)} color="brand.light" bg="brand.dark" borderColor="whiteAlpha.200" sx={{ "&::-webkit-calendar-picker-indicator": { filter: "invert(1)" } }} />
                </FormControl>
              )}

              {exportType === "periodo" && (
                <HStack>
                  <FormControl>
                    <FormLabel color="gray.400">De</FormLabel>
                    <Input type="date" value={exportDataInicio} onChange={e => setExportDataInicio(e.target.value)} color="brand.light" bg="brand.dark" borderColor="whiteAlpha.200" sx={{ "&::-webkit-calendar-picker-indicator": { filter: "invert(1)" } }} />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.400">Até</FormLabel>
                    <Input type="date" value={exportDataFim} onChange={e => setExportDataFim(e.target.value)} color="brand.light" bg="brand.dark" borderColor="whiteAlpha.200" sx={{ "&::-webkit-calendar-picker-indicator": { filter: "invert(1)" } }} />
                  </FormControl>
                </HStack>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.100" pt={4}>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose} _hover={{ bg: "whiteAlpha.100" }}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={generateDetailedPDF} isLoading={isExporting} loadingText="Gerando..." isDisabled={(exportType === "dia_especifico" && !exportDataEspecifica) || (exportType === "periodo" && (!exportDataInicio || !exportDataFim))}>
              <Icon as={FiDownload} mr={2} /> Baixar PDF
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  )
}

const MotionTr = motion(Tr)

export default RelatoriosPage
