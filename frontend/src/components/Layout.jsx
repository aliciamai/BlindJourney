// ============================================================
// BlindJourney – Shell Principal de la App
// Autora: Alicia Maillo
//
// Componente que envuelve todas las páginas protegidas.
// Proporciona:
// - Top bar: logo clickable, toggle tema, toggle idioma
// - Área de contenido: <Outlet /> renderiza la página actual
// - Bottom navigation: 5 botones de navegación (Inicio, Viajes, Buscar, Docs, Perfil)
//
// Estructura: 3 capas fijas (top) + flex (content) + 3 capas fijas (bottom)
// Max-width: 480px (diseño mobile-first)
// ============================================================

// useNavigate: para cambiar de ruta
// useLocation: para conocer la ruta actual (necesario para destacar nav item activo)
// Outlet: renderiza la página actualmente enrutada
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
// Componentes de MUI para construir la UI
import {
  Box, BottomNavigation, BottomNavigationAction,
  IconButton, Typography, Tooltip,
} from '@mui/material';
// Iconos de MUI (material design icons)
import HomeIcon   from '@mui/icons-material/Home';
import FlightIcon  from '@mui/icons-material/Flight';
import SearchIcon  from '@mui/icons-material/Search';
import FolderIcon  from '@mui/icons-material/Folder';
import PersonIcon  from '@mui/icons-material/Person';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
// Traducciones
import { useTranslation } from 'react-i18next';
// Hook para acceder al tema actual y cambiarlo
import { useThemeMode } from '../context/ThemeContext';

// ── FUNCIÓN AUXILIAR: Mapear Ruta a Índice Nav ──────────
/**
 * Convierte la ruta actual al índice del botón de navegación que debe estar destacado.
 * Parámetros: pathname (ej. "/dashboard", "/viajes/123")
 * Devuelve: 0-4 (índice en navItems) o false (ninguno coincide)
 *
 * Lógica: /dashboard → 0, /viajes/* → 1, etc.
 * Nota: usar startsWith permite que /viajes/123, /viajes/nuevo también destaquen el botón "Viajes"
 */
function getNavValue(pathname) {
  if (pathname === '/dashboard')          return 0;  // Inicio
  if (pathname.startsWith('/viajes'))     return 1;  // Viajes
  if (pathname.startsWith('/buscador'))   return 2;  // Buscar
  if (pathname.startsWith('/documentos')) return 3;  // Documentos
  if (pathname.startsWith('/perfil'))     return 4;  // Perfil
  return false;  // No coincide con ninguno
}

// ── COMPONENTE LAYOUT (SHELL PRINCIPAL) ──────────────────
/**
 * Envoltorio que encapsula la estructura de la app:
 * - Top bar fijo
 * - Contenido flexible que crece/encoge
 * - Bottom navigation fija
 *
 * Props: children se renderiza implícitamente a través de <Outlet />
 */
export default function Layout() {
  // Para navegar a rutas
  const navigate = useNavigate();
  // Para saber la ruta actual (necesario para destacar nav item)
  const location = useLocation();
  // Para acceso a traducciones y cambio de idioma
  const { t, i18n } = useTranslation();
  // Para acceso a tema actual y toggle tema
  const { mode, toggleTheme } = useThemeMode();

  // Calcula cuál es el índice del nav item que debe estar activo
  const value = getNavValue(location.pathname);

  // ── DEFINICIÓN DE ITEMS DE NAVEGACIÓN ───────────────────
  // Array con los 5 botones de navegación: etiqueta, icono, ruta
  const navItems = [
    { label: t('nav.home'),     icon: <HomeIcon />,   path: '/dashboard' },
    { label: t('nav.trips'),    icon: <FlightIcon />, path: '/viajes' },
    { label: t('nav.search'),   icon: <SearchIcon />, path: '/buscador' },
    { label: t('nav.docs'),     icon: <FolderIcon />, path: '/documentos' },
    { label: t('nav.profile'),  icon: <PersonIcon />, path: '/perfil' },
  ];

  // ── FUNCIÓN: Toggle de Idioma ────────────────────────────
  /**
   * Cambia entre español e inglés.
   * Pasos:
   * 1. Calcula el siguiente idioma (es ↔ en)
   * 2. Llama a i18n.changeLanguage() para cambiar los textos de la app
   * 3. Guarda la preferencia en localStorage (clave 'bj_lang')
   */
  const toggleLang = () => {
    const next = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    localStorage.setItem('bj_lang', next);
  };

  // ── RENDER: Shell con top bar, contenido y bottom nav ────
  return (
    <Box
      sx={{
        display: 'flex',  // Estructura flexible: columnas (vertical)
        flexDirection: 'column',
        minHeight: '100vh',  // Ocupa al menos la altura de la pantalla
        bgcolor: 'background.default',
        maxWidth: 480,  // Constricción a ancho móvil
        mx: 'auto',  // Centrado
        position: 'relative',
      }}
    >
      {/* Barra superior: Logo, botones de tema e idioma */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1,
          borderBottom: '1px solid var(--bj-border)',
          bgcolor: 'var(--bj-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        <Typography
          onClick={() => navigate('/dashboard')}
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '1.05rem',
            color: '#f0a500',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          BlindJourney
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={toggleTheme} size="small" sx={{ color: 'var(--bj-text-muted)' }}>
              {mode === 'dark'
                ? <WbSunnyIcon sx={{ fontSize: 18 }} />
                : <DarkModeIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title={i18n.language === 'es' ? 'Switch to English' : 'Cambiar a Español'}>
            <Box
              onClick={toggleLang}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                border: '1px solid var(--bj-border)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--bj-text-muted)',
                cursor: 'pointer',
                userSelect: 'none',
                letterSpacing: '0.04em',
                '&:hover': { borderColor: '#f0a500', color: '#f0a500' },
                transition: 'all 0.15s',
              }}
            >
              {i18n.language === 'es' ? 'EN' : 'ES'}
            </Box>
          </Tooltip>
        </Box>
      </Box>

      {/* Page content */}
      <Box sx={{ flex: 1, pb: '68px' }}>
        <Outlet />
      </Box>

      {/* Bottom nav */}
      <BottomNavigation
        value={value}
        onChange={(_, newVal) => navigate(navItems[newVal].path)}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          zIndex: 100,
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction key={item.label} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Box>
  );
}
