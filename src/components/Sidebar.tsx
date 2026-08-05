import {
  Box, VStack, Icon, Avatar, Flex, Text, Divider,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent,
  DrawerFooter, DrawerHeader, DrawerOverlay,
} from "@chakra-ui/react"
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom"
import {
  FiFileText, FiDollarSign, FiShoppingCart, FiMonitor,
  FiPackage, FiBarChart2, FiUsers, FiLogOut, FiClock,
} from "react-icons/fi"
import { motion } from "framer-motion"
import { useData } from "../context/DataContext"

const MotionBox = motion(Box)

interface SidebarProps {
  isMenuOpen: boolean
  onMenuOpen: () => void
  onMenuClose: () => void
}

const NavItem = ({
  item,
  active,
  onClick,
}: {
  item: { path: string; icon: React.ElementType; label: string }
  active: boolean
  onClick?: () => void
}) => (
  <Box
    as={RouterLink}
    to={item.path}
    onClick={onClick}
    display="flex"
    alignItems="center"
    gap={3}
    px={4}
    py={3}
    borderRadius="xl"
    bg={active ? "brand.primary" : "transparent"}
    color={active ? "white" : "gray.400"}
    fontWeight={active ? "700" : "500"}
    fontSize="sm"
    _hover={{
      bg: active ? "brand.primaryDark" : "whiteAlpha.100",
      color: "white",
      textDecoration: "none",
    }}
    transition="all 0.2s"
  >
    <Icon as={item.icon} boxSize={5} flexShrink={0} />
    <Text>{item.label}</Text>
  </Box>
)

const BrandLogo = () => (
  <Flex align="center" gap={3} px={4} py={5} flexShrink={0}>
    <Box
      w="38px"
      h="38px"
      bg="brand.primary"
      borderRadius="xl"
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontSize="20px"
      flexShrink={0}
      boxShadow="0 0 16px rgba(255,107,0,0.5)"
    >
      🌭
    </Box>
    <Text
      fontFamily="'Press Start 2P', monospace"
      fontSize="9px"
      bgGradient="linear(to-r, brand.primary, brand.secondary)"
      bgClip="text"
      lineHeight={1.7}
    >
      HOT DOG<br />STATION
    </Text>
  </Flex>
)

const UserSection = ({ onLogout }: { onLogout: () => void }) => {
  const { currentUser } = useData()
  return (
    <Box px={3} pb={4} flexShrink={0}>
      <Divider borderColor="whiteAlpha.100" mb={3} />
      <Flex align="center" gap={3} px={2} mb={2}>
        <Avatar size="sm" name={currentUser?.nome} bg="brand.primary" color="white" />
        <Box flex={1} minW={0}>
          <Text color="white" fontSize="sm" fontWeight="bold" noOfLines={1}>
            {currentUser?.nome}
          </Text>
          <Text color="gray.500" fontSize="xs">
            {currentUser?.role === "admin" ? "Administrador" : "Funcionário"}
          </Text>
        </Box>
      </Flex>
      <Box
        as="button"
        onClick={onLogout}
        display="flex"
        alignItems="center"
        gap={3}
        px={4}
        py={2.5}
        borderRadius="xl"
        color="gray.500"
        w="100%"
        _hover={{ bg: "whiteAlpha.100", color: "red.400" }}
        transition="all 0.2s"
      >
        <Icon as={FiLogOut} boxSize={4} />
        <Text fontSize="sm" fontWeight="500">Sair</Text>
      </Box>
    </Box>
  )
}

const Sidebar = ({ isMenuOpen, onMenuClose }: SidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useData()

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(path + "/")

  const handleLogout = () => {
    logout()
    navigate("/login")
    onMenuClose()
  }

  const baseItems = [
    { path: "/", icon: FiMonitor, label: "Painel de Controle", requiredPerm: "none" },
    { path: "/pedidos", icon: FiFileText, label: "Comandas", requiredPerm: "pedidos" },
    { path: "/novo-pedido", icon: FiDollarSign, label: "Novo Pedido", requiredPerm: "pedidos" },
    { path: "/estoque", icon: FiPackage, label: "Estoque", requiredPerm: "estoque" },
    { path: "/produtos", icon: FiShoppingCart, label: "Produtos", requiredPerm: "produtos" },
    { path: "/relatorios", icon: FiBarChart2, label: "Relatórios", requiredPerm: "relatorios" },
    { path: "/historico", icon: FiClock, label: "Histórico", requiredPerm: "pedidos" },
  ]

  const navItems = [
    ...baseItems.filter((item) => {
      if (item.requiredPerm === "none" || currentUser?.role === "admin") return true
      return currentUser?.permissoes?.includes(item.requiredPerm)
    }),
    ...(currentUser?.role === "admin"
      ? [{ path: "/equipe", icon: FiUsers, label: "Equipe", requiredPerm: "admin" }]
      : []),
  ]

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <Box
        display={{ base: "none", md: "flex" }}
        flexDirection="column"
        bg="brand.darker"
        w="240px"
        h="100vh"
        borderRight="1px solid"
        borderColor="brand.surfaceborder"
        flexShrink={0}
        zIndex={11}
        overflow="hidden"
      >
        <BrandLogo />

        <VStack spacing={1} align="stretch" px={3} flex={1} overflowY="auto">
          {navItems.map((item, index) => (
            <MotionBox
              key={item.path}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 } as any}
            >
              <NavItem item={item} active={isActive(item.path)} />
            </MotionBox>
          ))}
        </VStack>

        <UserSection onLogout={handleLogout} />
      </Box>

      {/* ── Mobile Drawer ── */}
      <Drawer isOpen={isMenuOpen} onClose={onMenuClose} placement="left" size="xs">
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent bg="brand.darker" borderRight="1px solid" borderColor="brand.surfaceborder">
          <DrawerCloseButton color="white" top={4} right={4} />
          <DrawerHeader p={0} borderBottomWidth="1px" borderColor="brand.surfaceborder">
            <BrandLogo />
          </DrawerHeader>
          <DrawerBody py={4} px={3}>
            <VStack spacing={1} align="stretch">
              {navItems.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  active={isActive(item.path)}
                  onClick={onMenuClose}
                />
              ))}
            </VStack>
          </DrawerBody>
          <DrawerFooter p={0}>
            <Box w="100%">
              <UserSection onLogout={handleLogout} />
            </Box>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Sidebar
