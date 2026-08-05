import { extendTheme } from "@chakra-ui/react"

export const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      primary: "#FF6B00",     // Laranja Vibrante
      primaryDark: "#CC5500", // Laranja Escuro para hover
      secondary: "#FFD700",   // Dourado para detalhes e destaques
      dark: "#0F172A",        // Fundo principal escuro profundo (slate-900)
      darker: "#0B1120",      // Fundo ainda mais escuro para preencher painéis
      light: "#FFFFFF",       // Texto base
      surface: "rgba(30, 41, 59, 0.7)", // Superfícies translúcidas
      surfaceborder: "rgba(255, 255, 255, 0.08)" // Bordas de superfícies
    },
  },
  fonts: {
    heading: "'Bebas Neue', sans-serif",
    body: "'DM Sans', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "brand.darker",
        color: "brand.light",
        // Adicionando um padrão de malha sutil no fundo
        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 107, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)",
        backgroundAttachment: "fixed",
        overflowX: "hidden"
      },
      // Estilizar scrollbar
      "::-webkit-scrollbar": {
        width: "8px",
        height: "8px",
      },
      "::-webkit-scrollbar-track": {
        background: "brand.darker",
      },
      "::-webkit-scrollbar-thumb": {
        background: "brand.primary",
        borderRadius: "4px",
      },
      "::-webkit-scrollbar-thumb:hover": {
        background: "brand.primaryDark",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        borderRadius: "xl",
        transition: "all 0.3s ease",
      },
      variants: {
        primary: {
          bg: "brand.primary",
          color: "white",
          boxShadow: "0 4px 14px 0 rgba(255, 107, 0, 0.39)",
          _hover: {
            bg: "brand.primaryDark",
            transform: "translateY(-2px)",
            boxShadow: "0 6px 20px rgba(255, 107, 0, 0.5)",
            _disabled: {
              bg: "brand.primary",
            }
          },
          _active: {
            transform: "translateY(0)",
          }
        },
        ghost: {
          color: "brand.secondary",
          _hover: {
            bg: "whiteAlpha.100",
          }
        }
      },
    },
    Box: {
      variants: {
        glass: {
          bg: "brand.surface",
          backdropFilter: "blur(12px)",
          border: "1px solid",
          borderColor: "brand.surfaceborder",
          borderRadius: "2xl",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        }
      }
    },
    Heading: {
      baseStyle: {
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: "0.06em",
        fontWeight: "400",
      }
    }
  },
})
