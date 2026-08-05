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
            backgroundImage: "url('/img/ball-park-brand-RKQ4-Q5FF-o-unsplash.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.18,
            filter: "blur(2px) saturate(1.2)",
            zIndex: 0,
            pointerEvents: "none",
          }}
          _after={{
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(11,17,32,0.55) 0%, rgba(11,17,32,0.3) 40%, rgba(11,17,32,0.7) 100%)",
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
