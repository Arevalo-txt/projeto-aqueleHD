import React, { useState } from "react"
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  InputGroup,
  InputLeftElement,
  Icon,
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { FiMail, FiLock, FiLogIn } from "react-icons/fi"
import { useData } from "../context/DataContext"
import { useNavigate } from "react-router-dom"

const MotionBox = motion(Box)

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useData()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, senha)
      if (success) {
        toast({
          title: "Acesso Permitido",
          description: "Bem-vindo ao Hot Dog Station!",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
        navigate("/")
      } else {
        toast({
          title: "Acesso Negado",
          description: "E-mail ou senha incorretos, verifique e tente novamente.",
          status: "error",
          duration: 4000,
          isClosable: true,
        })
      }
    } catch (error) {
      toast({
        title: "Erro no Login",
        description: "Encontramos um problema. Tente novamente.",
        status: "error",
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="brand.background">
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        w="full"
        maxW="md"
        p={8}
        borderRadius="2xl"
        bg="brand.surface"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
        border="1px solid"
        borderColor="brand.surfaceborder"
        backdropFilter="blur(20px)"
        WebkitBackdropFilter="blur(20px)"
      >
        <VStack spacing={8} as="form" onSubmit={handleLogin}>
          <VStack spacing={2} textAlign="center">
            <Text fontSize="4xl">🌭</Text>
            <Heading
              size="sm"
              color="white"
              fontFamily="'Press Start 2P', monospace"
              bgGradient="linear(to-r, brand.primary, brand.secondary)"
              bgClip="text"
              lineHeight={1.6}
              textAlign="center"
            >
              HOT DOG<br />STATION
            </Heading>
            <Text color="gray.400" fontSize="md">
              Faça login no sistema de gestão
            </Text>
          </VStack>

          <VStack spacing={4} w="full">
            <FormControl isRequired>
              <FormLabel color="gray.300">E-mail</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiMail} color="brand.primary" />
                </InputLeftElement>
                <Input
                  type="email"
                  placeholder="admin@admin.com"
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _hover={{ borderColor: "brand.primary" }}
                  _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px var(--chakra-colors-brand-primary)" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="gray.300">Senha</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiLock} color="brand.primary" />
                </InputLeftElement>
                <Input
                  type="password"
                  placeholder="Sua senha secreta"
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _hover={{ borderColor: "brand.primary" }}
                  _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px var(--chakra-colors-brand-primary)" }}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </InputGroup>
            </FormControl>
          </VStack>

          <Button
            type="submit"
            colorScheme="orange"
            size="lg"
            w="full"
            isLoading={isLoading}
            loadingText="Entrando..."
            leftIcon={<FiLogIn />}
            bg="brand.primary"
            _hover={{ bg: "orange.400" }}
          >
            Entrar no Sistema
          </Button>
        </VStack>
      </MotionBox>
    </Flex>
  )
}

export default LoginPage
