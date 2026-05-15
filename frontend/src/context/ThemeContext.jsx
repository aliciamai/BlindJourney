// ============================================================
// BlindJourney – Contexto de Tema (Dark/Light)
// Autora: Alicia Maillo
//
// Gestiona el modo de tema (dark o light) de toda la aplicación.
// Proporciona:
// - mode: 'dark' o 'light' (persiste en localStorage)
// - toggleTheme(): cambia entre dark ↔ light
//
// El tema se aplica mediante Material-UI (MUI) ThemeProvider
// con un tema personalizado definido en theme/theme.js
// ============================================================

// Context API: para compartir el tema entre componentes sin prop drilling
// useMemo: optimización para evitar recalcular el tema en cada render
import { createContext, useContext, useState, useMemo } from 'react';
// ThemeProvider: componente de MUI que aplica un tema a todos los componentes MUI hijos
import { ThemeProvider } from '@mui/material/styles';
// CssBaseline: reset CSS de MUI que normaliza estilos en todos los navegadores
import CssBaseline from '@mui/material/CssBaseline';
// Función que crea el objeto de tema personalizado según el modo (dark/light)
import { createAppTheme } from '../theme/theme';

// Contexto que guardará el modo del tema
const ThemeCtx = createContext(null);

// ── PROVEEDOR DE TEMA ──────────────────────────────────────────
/**
 * Componente que proporciona el sistema de temas a toda la app.
 * Props: children (componentes hijos que usarán el tema)
 *
 * Características:
 * - Lee el modo guardado en localStorage (clave: 'bj_theme')
 * - Genera un objeto de tema personalizado según el modo
 * - Aplica el tema a todos los componentes MUI mediante ThemeProvider
 * - Proporciona toggle para cambiar entre dark y light
 */
export function AppThemeProvider({ children }) {
  // ── ESTADO DEL TEMA ────────────────────────────────────────
  // mode: 'dark' o 'light' (persiste en localStorage)
  // useState(() => ...) solo se ejecuta una vez al montar (inicializador)
  const [mode, setMode] = useState(
    () => localStorage.getItem('bj_theme') || 'dark'
    // Prioridad: localStorage > 'dark' (por defecto)
  );

  // ── TOGGLE TEMA ────────────────────────────────────────────
  /**
   * Cambia entre tema oscuro y claro.
   * Pasos:
   * 1. Calcula el siguiente modo (dark ↔ light)
   * 2. Actualiza el estado de React
   * 3. Persiste en localStorage para que se recuerde tras recargar
   */
  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('bj_theme', next);
    // Los componentes suscritos al contexto se re-renderizan automáticamente
  };

  // ── GENERACIÓN DEL TEMA PERSONALIZADO ──────────────────────
  // useMemo: optimización para evitar regenerar el tema en cada render
  // Solo regenera cuando 'mode' cambia (dependencia: [mode])
  // Sin useMemo, cada componente que use useThemeMode() forzaría un recálculo
  // (muy costoso porque createAppTheme() genera un objeto de tema completo)
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // ── PROVISIÓN DEL CONTEXTO ────────────────────────────────
  return (
    <ThemeCtx.Provider value={{ mode, toggleTheme }}>
      {/* ThemeProvider: aplica el objeto de tema a todos los componentes MUI */}
      <ThemeProvider theme={theme}>
        {/* CssBaseline: normalización de estilos CSS entre navegadores */}
        <CssBaseline />
        {/* Contenido de la aplicación */}
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}

// ── HOOK DE ACCESO ────────────────────────────────────────────
/**
 * Hook que devuelve el contexto de tema.
 * Se usa así en componentes:
 * const { mode, toggleTheme } = useThemeMode();
 *
 * Ejemplo de uso:
 * - Mostrar el icono de sol/luna según el modo
 * - Aplicar estilos condicionales al modo (ej. visibilidad, colores)
 */
export const useThemeMode = () => useContext(ThemeCtx);
