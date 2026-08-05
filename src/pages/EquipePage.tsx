import { useState } from "react"
import {
  Box, Text, Button, Flex, Badge, Icon, IconButton, Grid, GridItem,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
  VStack, Switch, useDisclosure, useToast, Avatar,
} from "@chakra-ui/react"
import { motion, Variants } from "framer-motion"
import { FiPlus, FiTrash2, FiEdit2, FiShield, FiUsers, FiLock } from "react-icons/fi"
import { useData, Usuario } from "../context/DataContext"

const MotionBox = motion(Box)
const MotionGridItem = motion(GridItem)

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

const permLabels: Record<string, { label: string; color: string }> = {
  pedidos:   { label: "Pedidos",    color: "blue"   },
  estoque:   { label: "Estoque",    color: "gray"   },
  produtos:  { label: "Cardápio",   color: "purple" },
  relatorios:{ label: "Relatórios", color: "yellow" },
}

const EquipePage = () => {
  const { usuarios, currentUser, addUsuario, updateUsuario, deleteUsuario } = useData()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [usuarioEdit, setUsuarioEdit] = useState<Partial<Usuario> | null>(null)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [isPermPedidos, setIsPermPedidos] = useState(false)
  const [isPermEstoque, setIsPermEstoque] = useState(false)
  const [isPermProdutos, setIsPermProdutos] = useState(false)
  const [isPermRelatorios, setIsPermRelatorios] = useState(false)

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setUsuarioEdit(usuario)
      setNome(usuario.nome)
      setEmail(usuario.email)
      setSenha(usuario.senha || "")
      setIsPermPedidos(usuario.permissoes.includes("pedidos"))
      setIsPermEstoque(usuario.permissoes.includes("estoque"))
      setIsPermProdutos(usuario.permissoes.includes("produtos"))
      setIsPermRelatorios(usuario.permissoes.includes("relatorios"))
    } else {
      setUsuarioEdit(null)
      setNome(""); setEmail(""); setSenha("")
      setIsPermPedidos(false); setIsPermEstoque(false)
      setIsPermProdutos(false); setIsPermRelatorios(false)
    }
    onOpen()
  }

  const handleSave = async () => {
    if (!nome || !email || (!usuarioEdit && !senha)) {
      toast({ title: "Campos obrigatórios", description: "Preencha Nome, Email e Senha.", status: "warning" })
      return
    }
    const permissoesArr: string[] = []
    if (isPermPedidos)   permissoesArr.push("pedidos")
    if (isPermEstoque)   permissoesArr.push("estoque")
    if (isPermProdutos)  permissoesArr.push("produtos")
    if (isPermRelatorios) permissoesArr.push("relatorios")

    try {
      if (usuarioEdit?.id) {
        await updateUsuario({
          ...usuarioEdit,
          nome, email,
          senha: senha || usuarioEdit.senha,
          role: usuarioEdit.role || "funcionario",
          permissoes: usuarioEdit.role === "admin"
            ? ["pedidos", "estoque", "produtos", "relatorios", "equipe"]
            : permissoesArr,
          id: usuarioEdit.id,
          criadoEm: usuarioEdit.criadoEm || new Date(),
        } as Usuario)
        toast({ title: "Usuário atualizado", status: "success" })
      } else {
        await addUsuario({ nome, email, senha, role: "funcionario", permissoes: permissoesArr })
        toast({ title: "Funcionário cadastrado", status: "success" })
      }
      onClose()
    } catch {
      toast({ title: "Erro ao salvar", status: "error" })
    }
  }

  const handleDelete = async (id: string, role: string) => {
    if (role === "admin") {
      toast({ title: "Ação não permitida", description: "Não é possível remover o administrador.", status: "error" })
      return
    }
    if (window.confirm("Deseja mesmo remover este funcionário?")) {
      await deleteUsuario(id)
      toast({ title: "Usuário removido", status: "info" })
    }
  }

  if (currentUser?.role !== "admin") {
    return (
      <Flex align="center" justify="center" h="60vh" flexDir="column" gap={4}>
        <Icon as={FiLock} boxSize={14} color="red.400" />
        <Text fontSize="xl" fontWeight="bold" color="red.400">Acesso Restrito</Text>
        <Text color="gray.400">Você não tem permissão para acessar o painel da equipe.</Text>
      </Flex>
    )
  }

  return (
    <Box maxW="1400px" mx="auto" w="100%">
      {/* Header */}
      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700" color="brand.light">
            Gestão de Equipe
          </Text>
          <Text color="gray.400" mt={1} fontSize={{ base: "sm", md: "md" }}>
            {usuarios.length} {usuarios.length === 1 ? "membro" : "membros"} no sistema
          </Text>
        </Box>
        <Button
          leftIcon={<FiPlus />}
          onClick={() => handleOpenModal()}
          variant="primary"
          borderRadius="full"
          size={{ base: "sm", md: "md" }}
          px={6}
        >
          Novo Funcionário
        </Button>
      </Flex>

      {/* Cards de usuário */}
      <motion.div variants={container} initial="hidden" animate="visible">
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
          gap={5}
        >
          {usuarios.map((user) => {
            const initials = user.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
            const isAdmin = user.role === "admin"

            return (
              <MotionGridItem
                key={user.id}
                variants={item}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Box
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor={isAdmin ? "brand.primary" : "brand.surfaceborder"}
                  borderRadius="2xl"
                  p={6}
                  position="relative"
                  overflow="hidden"
                  h="100%"
                >
                  {/* Glow sutil para admin */}
                  {isAdmin && (
                    <Box
                      position="absolute"
                      top="-40px" right="-40px"
                      w="120px" h="120px"
                      borderRadius="full"
                      bg="brand.primary"
                      filter="blur(50px)"
                      opacity={0.15}
                      pointerEvents="none"
                    />
                  )}

                  {/* Avatar + ações */}
                  <Flex justify="space-between" align="flex-start" mb={4}>
                    <Avatar
                      name={user.nome}
                      size="md"
                      bg={isAdmin ? "brand.primary" : "whiteAlpha.200"}
                      color="white"
                      fontWeight="bold"
                      getInitials={() => initials}
                    />
                    <Flex gap={1}>
                      <IconButton
                        aria-label="Editar"
                        icon={<FiEdit2 />}
                        size="sm"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: "brand.primary", bg: "whiteAlpha.100" }}
                        onClick={() => handleOpenModal(user)}
                      />
                      <IconButton
                        aria-label="Excluir"
                        icon={<FiTrash2 />}
                        size="sm"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: "red.400", bg: "whiteAlpha.100" }}
                        onClick={() => handleDelete(user.id, user.role)}
                        isDisabled={isAdmin}
                      />
                    </Flex>
                  </Flex>

                  {/* Info */}
                  <Text color="brand.light" fontWeight="700" fontSize="lg" noOfLines={1}>
                    {user.nome}
                  </Text>
                  <Text color="gray.500" fontSize="sm" mb={4} noOfLines={1}>
                    {user.email}
                  </Text>

                  {/* Cargo */}
                  <Flex align="center" gap={2} mb={4}>
                    <Icon as={isAdmin ? FiShield : FiUsers} color={isAdmin ? "brand.primary" : "gray.400"} boxSize={3.5} />
                    <Badge
                      colorScheme={isAdmin ? "orange" : "green"}
                      borderRadius="full"
                      px={3} py={1}
                      fontSize="xs"
                    >
                      {isAdmin ? "Administrador" : "Funcionário"}
                    </Badge>
                  </Flex>

                  {/* Permissões */}
                  <Box>
                    <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider" mb={2}>
                      Acessos
                    </Text>
                    <Flex gap={2} flexWrap="wrap">
                      {isAdmin ? (
                        <Badge colorScheme="purple" borderRadius="full" px={2}>
                          <Flex align="center" gap={1}>
                            <FiShield size={10} />
                            Acesso Total
                          </Flex>
                        </Badge>
                      ) : user.permissoes.length === 0 ? (
                        <Text color="gray.600" fontSize="xs">Nenhum acesso</Text>
                      ) : (
                        <>
                          {user.permissoes.includes("pedidos") && (
                            <>
                              <Badge colorScheme="blue"  borderRadius="full" px={2} fontSize="xs">Pedidos</Badge>
                              <Badge colorScheme="teal"  borderRadius="full" px={2} fontSize="xs">Histórico</Badge>
                            </>
                          )}
                          {user.permissoes.includes("estoque")    && <Badge colorScheme="gray"   borderRadius="full" px={2} fontSize="xs">Estoque</Badge>}
                          {user.permissoes.includes("produtos")   && <Badge colorScheme="purple" borderRadius="full" px={2} fontSize="xs">Cardápio</Badge>}
                          {user.permissoes.includes("relatorios") && <Badge colorScheme="yellow" borderRadius="full" px={2} fontSize="xs">Relatórios</Badge>}
                        </>
                      )}
                    </Flex>
                  </Box>
                </Box>
              </MotionGridItem>
            )
          })}
        </Grid>
      </motion.div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent bg="brand.darker" border="1px solid" borderColor="brand.surfaceborder" borderRadius="2xl">
          <ModalHeader color="brand.secondary" borderBottomWidth={1} borderBottomColor="whiteAlpha.100" bg="whiteAlpha.50" pt={5} pb={4}>
            {usuarioEdit ? "Editar Funcionário" : "Novo Funcionário"}
          </ModalHeader>
          <ModalCloseButton color="brand.light" mt={2} />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel color="gray.400" fontSize="sm">Nome Completo</FormLabel>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João da Silva"
                  bg="whiteAlpha.50" border="1px solid" borderColor="brand.surfaceborder" borderRadius="xl"
                  _focus={{ borderColor: "brand.primary" }} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="gray.400" fontSize="sm">Email de Acesso</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="funcionario@aquelehotdogs.com"
                  bg="whiteAlpha.50" border="1px solid" borderColor="brand.surfaceborder" borderRadius="xl"
                  _focus={{ borderColor: "brand.primary" }} />
              </FormControl>
              <FormControl isRequired={!usuarioEdit}>
                <FormLabel color="gray.400" fontSize="sm">Senha</FormLabel>
                <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                  placeholder={usuarioEdit ? "Deixe em branco para manter" : "••••••••"}
                  bg="whiteAlpha.50" border="1px solid" borderColor="brand.surfaceborder" borderRadius="xl"
                  _focus={{ borderColor: "brand.primary" }} />
              </FormControl>

              {usuarioEdit?.role !== "admin" && (
                <Box p={5} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="brand.surfaceborder">
                  <Text mb={4} fontWeight="700" color="brand.primary" fontSize="sm" textTransform="uppercase" letterSpacing="wider">
                    Níveis de Acesso
                  </Text>
                  <VStack align="stretch" spacing={4}>
                    {[
                      { id: "perm-pedidos",    label: "Área de Pedidos (Comandas, Cobranças e Histórico)", checked: isPermPedidos,    set: setIsPermPedidos },
                      { id: "perm-produtos",   label: "Gestão do Cardápio (Mudar preços e itens)",         checked: isPermProdutos,   set: setIsPermProdutos },
                      { id: "perm-estoque",    label: "Controle de Estoque (Adicionar insumos)",           checked: isPermEstoque,    set: setIsPermEstoque },
                      { id: "perm-relatorios", label: "Inteligência (Ver faturamento e relatórios)",       checked: isPermRelatorios, set: setIsPermRelatorios },
                    ].map((perm) => (
                      <FormControl key={perm.id} display="flex" alignItems="center">
                        <FormLabel htmlFor={perm.id} mb="0" flex="1" color="gray.300" fontSize="sm" cursor="pointer">
                          {perm.label}
                        </FormLabel>
                        <Switch id={perm.id} colorScheme="orange" isChecked={perm.checked}
                          onChange={(e) => perm.set(e.target.checked)} />
                      </FormControl>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" color="gray.400" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} px={8}>Salvar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default EquipePage
