import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  useToast,
  Icon,
} from "@chakra-ui/react"
import { motion, Variants } from "framer-motion"
import { Link as RouterLink } from "react-router-dom"
import { useData } from "../context/DataContext"
import { FiRefreshCw, FiClock, FiCheckCircle, FiDollarSign, FiPackage, FiActivity, FiArrowRight } from "react-icons/fi"
import { useState } from "react"

const MotionBox = motion(Box)
const MotionGridItem = motion(GridItem)

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
}

const HomePage = () => {
  const { pedidos, vendas, produtos, estoque, refreshData, currentUser } = useData()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const toast = useToast()

  const pedidosAbertos = pedidos.filter((p) => p.status === "aberto").length
  const pedidosFechados = pedidos.filter((p) => p.status === "fechado").length
  const vendasHoje = vendas.filter((v) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataVenda = new Date(v.data)
    return dataVenda >= hoje
  })
  const faturamentoHoje = vendasHoje.reduce((total, venda) => total + venda.valor, 0)
  const produtosAtivos = produtos.filter((p) => p.ativo).length
  const itensEstoqueBaixo = estoque.filter((item) => item.quantidade <= item.estoqueMinimo).length

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
      toast({
        title: "Dados atualizados",
        description: "Os dados foram sincronizados com sucesso.",
        status: "success",
        duration: 3000,
        isClosable: true,
        variant: "subtle",
        colorScheme: "orange",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao sincronizar dados.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const statCards = [
    {
      label: "Comandas Abertas",
      value: pedidosAbertos,
      helpText: "Em andamento",
      icon: FiClock,
      color: "blue.400",
    },
    {
      label: "Pronto / Fechado",
      value: pedidosFechados,
      helpText: "Aguardando pgto",
      icon: FiCheckCircle,
      color: "green.400",
    },
    {
      label: "Faturamento Hoje",
      value: `R$ ${faturamentoHoje.toFixed(2)}`,
      helpText: `${vendasHoje.length} vendas`,
      icon: FiDollarSign,
      color: "brand.secondary",
    },
    {
      label: "Produtos Ativos",
      value: produtosAtivos,
      helpText: `De ${produtos.length} no cardápio`,
      icon: FiPackage,
      color: "purple.400",
    },
    {
      label: "Estoque Baixo",
      value: itensEstoqueBaixo,
      helpText: "Atenção necessária",
      icon: FiActivity,
      color: itensEstoqueBaixo > 0 ? "red.400" : "gray.400",
    },
    {
      label: "Total Vendas",
      value: vendas.length,
      helpText: "Histórico geral",
      icon: FiDollarSign,
      color: "teal.400",
    },
  ]

  const funcStatCards = [
    {
      label: "Comandas Abertas",
      value: pedidosAbertos,
      helpText: "Atendimentos em andamento",
      icon: FiClock,
      color: "blue.400",
    },
    {
      label: "Pronto / Fechado",
      value: pedidosFechados,
      helpText: "Aguardando pagamento",
      icon: FiCheckCircle,
      color: "green.400",
    },
  ]

  const isAdmin = currentUser?.role === "admin"
  const activeStatCards = isAdmin ? statCards : funcStatCards
  const temPermissaoPedidos = isAdmin || (currentUser?.permissoes || []).includes("pedidos")

  return (
    <Box maxW="1400px" mx="auto" w="100%">
      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} mb={{ base: 6, md: 10 }} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size={{ base: "lg", md: "xl" }} color="brand.light" fontWeight="700">
            {isAdmin ? "Painel de Controle" : `Olá, ${currentUser?.nome?.split(' ')[0]}!`}
          </Heading>
          <Text color="gray.400" mt={1} fontSize={{ base: "sm", md: "md" }}>
            {isAdmin ? "Visão geral do Hot Dog Station" : "Bom turno de trabalho! Veja como estamos:"}
          </Text>
        </Box>
        <Button
          leftIcon={<FiRefreshCw />}
          onClick={handleRefresh}
          isLoading={isRefreshing}
          loadingText="Atualizando"
          variant="outline"
          borderColor="brand.surfaceborder"
          color="brand.light"
          _hover={{ bg: "whiteAlpha.200", borderColor: "brand.primary" }}
          borderRadius="full"
          size={{ base: "sm", md: "md" }}
          px={6}
        >
          Sincronizar
        </Button>
      </Flex>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: isAdmin ? "repeat(3, 1fr)" : "repeat(2, 1fr)" }} gap={6} mb={10}>
          {activeStatCards.map((stat, i) => (
            <MotionGridItem key={i} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Box bg="whiteAlpha.50" border="1px solid" borderColor="brand.surfaceborder" p={6} borderRadius="2xl" position="relative" overflow="hidden" role="group">
                <Box
                  position="absolute"
                  top="-20px"
                  right="-20px"
                  opacity={0.05}
                  transform="scale(1)"
                  transition="transform 0.3s"
                  _groupHover={{ transform: "scale(1.2)", opacity: 0.1 }}
                >
                  <Icon as={stat.icon} boxSize="150px" color={stat.color} />
                </Box>
                <Flex justify="space-between" align="flex-start" position="relative" zIndex={1}>
                  <Stat>
                    <StatLabel color="gray.400" fontSize="sm" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                      {stat.label}
                    </StatLabel>
                    <StatNumber color="brand.light" fontSize="4xl" fontWeight="700" my={2}>
                      {stat.value}
                    </StatNumber>
                    <StatHelpText color={stat.color} fontWeight="500" display="flex" alignItems="center">
                      <Icon as={stat.icon} mr={2} />
                      {stat.helpText}
                    </StatHelpText>
                  </Stat>
                </Flex>
              </Box>
            </MotionGridItem>
          ))}
        </Grid>

        {temPermissaoPedidos && (
          <MotionBox variants={itemVariants} width="100%">
            <Flex
              direction={{ base: "column", lg: "row" }}
              align="center"
              justify="space-between"
              p={8}
              position="relative"
              overflow="hidden"
              borderRadius="2xl"
            >
              <Box
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="brand.surfaceborder"
                borderRadius="2xl"
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                zIndex={0}
              />
              <Box
                position="absolute"
                bg="brand.primary"
                w="300px"
                h="300px"
                rounded="full"
                filter="blur(100px)"
                opacity={0.15}
                top="-100px"
                left="-100px"
                zIndex={0}
              />
              
              <Box flex="1" mb={{ base: 8, lg: 0 }} position="relative" zIndex={1}>
                <Heading mb={4} size="lg" color="brand.light">
                  Ações Rápidas
                </Heading>
                <Text fontSize="md" color="gray.400" maxW="500px">
                  Acesse as principais funcionalidades do sistema com um clique para agilizar o atendimento.
                </Text>
              </Box>
              
              <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap={4} flex="1" w="100%" position="relative" zIndex={1}>
                <Button as={RouterLink} to="/novo-pedido" variant="primary" size="lg" h="80px" display="flex" flexDirection="column" gap={2}>
                  <Icon as={FiDollarSign} boxSize={5} />
                  Nova Comanda
                </Button>
                <Button
                  as={RouterLink}
                  to="/pedidos"
                  variant="outline"
                  borderColor="brand.primary"
                  color="brand.primary"
                  _hover={{ bg: "brand.primary", color: "white" }}
                  size="lg"
                  h="80px"
                  display="flex"
                  flexDirection="column"
                  gap={2}
                >
                  <Icon as={FiCheckCircle} boxSize={5} />
                  Ver Pedidos
                </Button>
              </Grid>
            </Flex>
          </MotionBox>
        )}
      </motion.div>
    </Box>
  )
}

export default HomePage
