import type React from "react"
import { Box, Flex, useDisclosure } from "@chakra-ui/react"
import { motion, AnimatePresence } from "framer-motion"
import { useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Flex h="100vh" w="100%" overflow="hidden">
      <Sidebar isMenuOpen={isOpen} onMenuOpen={onOpen} onMenuClose={onClose} />

      <Flex direction="column" flex="1" h="100vh" minW={0} position="relative">
        <Header onMenuOpen={onOpen} />

        {/* Imagem de fundo no conteúdo — troque a URL por uma foto de hot dogs real */}
        <Box
          flex="1"
          overflowY="auto"
          position="relative"
          _before={{
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/img/Logomascotehotdog.png')",
            backgroundSize: "45%",
            backgroundPosition: "95% 5%",
            backgroundRepeat: "no-repeat",
            opacity: 0.07,
            filter: "blur(1px) saturate(0.6)",
            zIndex: 0,
            pointerEvents: "none",
          }}
          _after={{
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 80% 5%, rgba(200,90,0,0.18) 0%, transparent 45%), radial-gradient(ellipse at 95% 20%, rgba(230,160,0,0.12) 0%, transparent 35%)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <Box
            position="relative"
            zIndex={1}
            p={{ base: 3, md: 6 }}
            pb={{ base: 6, md: 6 }}
            minH="100%"
          >
            <AnimatePresence mode="sync">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ minHeight: "100%" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
      </Flex>
    </Flex>
  )
}

export default Layout
