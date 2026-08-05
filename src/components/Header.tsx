import { Box, Flex, Avatar, IconButton } from "@chakra-ui/react"
import { FiBell, FiSettings, FiMenu } from "react-icons/fi"
import { useData } from "../context/DataContext"

interface HeaderProps {
  onMenuOpen?: () => void
}

const Header = ({ onMenuOpen }: HeaderProps) => {
  const { currentUser } = useData()

  return (
    <Box
      as="header"
      w="100%"
      px={{ base: 4, md: 6 }}
      py={3}
      bg="brand.surface"
      backdropFilter="blur(16px)"
      sx={{ WebkitBackdropFilter: "blur(16px)" }}
      borderBottom="1px solid"
      borderColor="brand.surfaceborder"
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="0 4px 30px rgba(0, 0, 0, 0.15)"
    >
      <Flex justify="space-between" align="center">
        {/* Mobile hamburger */}
        <IconButton
          display={{ base: "flex", md: "none" }}
          aria-label="Abrir menu"
          icon={<FiMenu />}
          variant="ghost"
          color="white"
          size="sm"
          onClick={onMenuOpen}
          _hover={{ bg: "whiteAlpha.200" }}
        />

        {/* Right icons — alinhados à direita mesmo no desktop */}
        <Flex align="center" gap={1} ml="auto">
          <IconButton
            aria-label="Notificações"
            icon={<FiBell />}
            variant="ghost"
            color="brand.light"
            _hover={{ bg: "whiteAlpha.200", color: "brand.primary" }}
            isRound
          />
          <IconButton
            aria-label="Configurações"
            icon={<FiSettings />}
            variant="ghost"
            color="brand.light"
            _hover={{ bg: "whiteAlpha.200", color: "brand.primary" }}
            isRound
          />
          <Avatar
            size="sm"
            name={currentUser?.nome ?? "User"}
            bg="brand.primary"
            border="2px solid"
            borderColor="brand.secondary"
            ml={1}
          />
        </Flex>
      </Flex>
    </Box>
  )
}

export default Header
