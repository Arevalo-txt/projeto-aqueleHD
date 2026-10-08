import { Box, Flex, Text } from "@chakra-ui/react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

const MotionBox = motion(Box)

// ── SVGs ────────────────────────────────────────────────────────────────────

const Salsicha = () => (
  <svg width="120" height="34" viewBox="0 0 120 34" fill="none">
    <rect x="18" y="2" width="84" height="30" rx="15" fill="#C8564E" />
    <ellipse cx="18" cy="17" rx="15" ry="15" fill="#B0423A" />
    <ellipse cx="102" cy="17" rx="15" ry="15" fill="#B0423A" />
    <ellipse cx="60" cy="10" rx="30" ry="6.5" fill="rgba(255,255,255,0.18)" />
    <line x1="46" y1="5"  x2="44" y2="29" stroke="rgba(100,30,20,0.35)" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="62" y1="3"  x2="60" y2="31" stroke="rgba(100,30,20,0.35)" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="78" y1="5"  x2="76" y2="29" stroke="rgba(100,30,20,0.35)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

/* Pão 1 — metade inferior, retangular (HOT DOG, não hamburguer) */
const Pao = () => (
  <svg width="155" height="40" viewBox="0 0 155 40" fill="none">
    {/* sombra */}
    <rect x="5" y="28" width="145" height="11" rx="5" fill="#7A3E0E" />
    {/* corpo — retângulo com pontas arredondadas */}
    <rect x="5" y="4"  width="145" height="30" rx="12" fill="#C8822A" />
    {/* miolo (face cortada) */}
    <rect x="11" y="4" width="133" height="20" rx="9"  fill="#E8A850" />
    {/* brilho */}
    <ellipse cx="77" cy="11" rx="46" ry="6" fill="rgba(255,220,140,0.22)" />
  </svg>
)

/* Pão 2 — metade superior, mesmo formato mas bem mais alto */
const PaoArco = () => (
  <svg width="155" height="58" viewBox="0 0 155 58" fill="none">
    {/* sombra */}
    <rect x="5" y="45" width="145" height="12" rx="5" fill="#7A3E0E" />
    {/* corpo — mesma forma retangular do pão 1, só mais alto */}
    <rect x="5" y="4"  width="145" height="48" rx="14" fill="#C8822A" />
    {/* miolo (face cortada interna) */}
    <rect x="11" y="4" width="133" height="34" rx="10" fill="#D8924A" />
    {/* brilho topo */}
    <ellipse cx="77" cy="14" rx="46" ry="8" fill="rgba(255,220,140,0.18)" />
    {/* gergelim — no topo do pão */}
    <ellipse cx="44"  cy="22" rx="6"   ry="3"   fill="#E8B870" transform="rotate(-15 44 22)" />
    <ellipse cx="77"  cy="15" rx="6"   ry="3"   fill="#E8B870" />
    <ellipse cx="111" cy="22" rx="6"   ry="3"   fill="#E8B870" transform="rotate(15 111 22)" />
    <ellipse cx="58"  cy="32" rx="5"   ry="2.5" fill="#E8B870" transform="rotate(-8 58 32)" />
    <ellipse cx="97"  cy="32" rx="5"   ry="2.5" fill="#E8B870" transform="rotate(8 97 32)" />
  </svg>
)

// ── Loading dots ─────────────────────────────────────────────────────────────

const Dot = ({ delay }: { delay: number }) => (
  <MotionBox
    w="9px" h="9px"
    borderRadius="full"
    bg="#FF6B00"
    animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 0.9, delay, repeat: Infinity, ease: "easeInOut" }}
  />
)

// ── Componente principal ──────────────────────────────────────────────────────

interface SplashScreenProps {
  isVisible: boolean
}

// O back-end no plano gratuito do Render "dorme" após inatividade e pode levar
// cerca de um minuto para responder; após alguns segundos, avisa o usuário.
const AVISO_SERVIDOR_MS = 5000

const SplashScreen = ({ isVisible }: SplashScreenProps) => {
  const [demorando, setDemorando] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setDemorando(false)
      return
    }
    const timer = setTimeout(() => setDemorando(true), AVISO_SERVIDOR_MS)
    return () => clearTimeout(timer)
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <MotionBox
          position="fixed"
          inset={0}
          zIndex={99999}
          bg="#080818"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={8}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <Box
            position="absolute"
            w="400px" h="400px"
            borderRadius="full"
            bg="radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)"
            pointerEvents="none"
          />

          {/*
            z-order: pão baixo (1) < pão cima (5) < salsicha (20)
            A salsicha SEMPRE fica na frente dos dois pães.
          */}
          <Box position="relative" w="210px" h="200px">

            {/* Pão de baixo — na frente da salsicha e do pão 2 */}
            <Box
              position="absolute"
              bottom="4px"
              left="50%"
              marginLeft="-77px"
              zIndex={20}
            >
              <Pao />
            </Box>

            {/* Salsicha — entre os dois pães */}
            <MotionBox
              position="absolute"
              bottom="26px"
              left="50%"
              marginLeft="-60px"
              zIndex={10}
              animate={{
                y:      [0, 0, -10, -110, -110, -110, -10, 0, 0],
                rotate: [0, 0,   0,    0,  180,  360,  360, 360, 360],
                scaleX: [1, 1, 0.85,   1,    1,    1,    1, 0.85, 1],
                scaleY: [1, 1, 1.15,   1,    1,    1,    1, 1.15, 1],
              }}
              transition={{
                duration: 2.4,
                times:    [0, 0.08, 0.18, 0.38, 0.52, 0.66, 0.82, 0.92, 1],
                repeat: Infinity,
                repeatDelay: 0.6,
                ease: "easeInOut",
              }}
            >
              <Salsicha />
            </MotionBox>

            {/* Pão 2 — atrás de tudo */}
            <MotionBox
              position="absolute"
              bottom="30px"
              left="50%"
              marginLeft="-77px"
              zIndex={1}
              animate={{ y: [0, 0, -8, -8, -8, -8, -8, 0, 0] }}
              transition={{
                duration: 2.4,
                times:    [0, 0.08, 0.18, 0.38, 0.52, 0.66, 0.82, 0.92, 1],
                repeat: Infinity,
                repeatDelay: 0.6,
                ease: "easeInOut",
              }}
            >
              <PaoArco />
            </MotionBox>
          </Box>

          <Text
            fontFamily="'Press Start 2P', monospace"
            fontSize={{ base: "md", md: "lg" }}
            bgGradient="linear(to-r, #FF6B00, #FFD700)"
            bgClip="text"
            textAlign="center"
            lineHeight={1.6}
          >
            HOT DOG<br />STATION
          </Text>

          <Flex gap={3} align="center">
            <Dot delay={0} />
            <Dot delay={0.15} />
            <Dot delay={0.30} />
          </Flex>

          {demorando && (
            <Text color="whiteAlpha.700" fontSize="sm" textAlign="center" maxW="320px" px={4}>
              Iniciando o servidor… isso pode levar até 1 minuto no primeiro acesso.
            </Text>
          )}
        </MotionBox>
      )}
    </AnimatePresence>
  )
}

export default SplashScreen
