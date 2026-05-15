import { createTheme } from '@mui/material/styles';

const DARK = {
  bg:        '#0d0f14',
  surface:   '#161b26',
  surface2:  '#1e2535',
  border:    '#2a3347',
  text:      '#e8eaf0',
  textMuted: '#7b8aaa',
  success:   '#3ddc84',
};

const LIGHT = {
  bg:        '#f4f6fb',
  surface:   '#ffffff',
  surface2:  '#f0f2f8',
  border:    '#dde3f0',
  text:      '#1a1f2e',
  textMuted: '#5a6383',
  success:   '#28a86b',
};

export function createAppTheme(mode) {
  const c = mode === 'dark' ? DARK : LIGHT;

  return createTheme({
    palette: {
      mode,
      background: { default: c.bg, paper: c.surface },
      primary:    { main: '#f0a500', contrastText: '#000000' },
      secondary:  { main: '#e05c5c', contrastText: '#ffffff' },
      success:    { main: c.success, contrastText: '#000000' },
      error:      { main: '#e05c5c' },
      text:       { primary: c.text, secondary: c.textMuted },
      divider:    c.border,
    },
    typography: {
      fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
      h1: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
      h2: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
      h3: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
      h4: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
      h5: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
      h6: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
      button: { fontWeight: 600, letterSpacing: '0.04em' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--bj-bg':         c.bg,
            '--bj-surface':    c.surface,
            '--bj-surface2':   c.surface2,
            '--bj-border':     c.border,
            '--bj-text':       c.text,
            '--bj-text-muted': c.textMuted,
            '--bj-success':    c.success,
            '--bj-accent':     '#f0a500',
            '--bj-error':      '#e05c5c',
          },
          body: {
            scrollbarColor: `${c.border} transparent`,
            '&::-webkit-scrollbar':       { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: c.border, borderRadius: '4px' },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 24px', fontWeight: 700 },
          containedPrimary: { color: '#000', '&:hover': { backgroundColor: '#e09500' } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: c.surface2,
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: c.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f0a500' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f0a500' },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { color: c.textMuted, fontSize: '0.85rem' } },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: c.surface2,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', backgroundColor: c.surface },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: c.surface2,
            borderColor: c.border,
            color: c.textMuted,
            transition: 'all 0.15s',
            '&.MuiChip-colorPrimary': {
              backgroundColor: 'rgba(240,165,0,0.15)',
              borderColor: '#f0a500',
              color: '#f0a500',
            },
          },
          outlined: { borderColor: c.border },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: { backgroundColor: c.bg, borderTop: `1px solid ${c.border}`, height: 60 },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: c.textMuted,
            minWidth: 50,
            '&.Mui-selected': { color: '#f0a500' },
            '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem' },
            '& .MuiBottomNavigationAction-label.Mui-selected': { fontSize: '0.65rem' },
          },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: c.border } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiStepper: {
        styleOverrides: { root: { backgroundColor: 'transparent', padding: 0 } },
      },
      MuiSlider: {
        styleOverrides: {
          root:  { color: '#f0a500' },
          thumb: { backgroundColor: '#f0a500' },
          track: { backgroundColor: '#f0a500' },
          rail:  { backgroundColor: c.border },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { backgroundColor: c.border, borderRadius: 4, height: 6 },
          bar:  { backgroundColor: '#f0a500' },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: c.textMuted,
            '&.Mui-selected': { color: '#f0a500' },
            fontSize: '0.82rem',
            textTransform: 'none',
            minHeight: 42,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: '#f0a500' },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: c.surface,
            borderBottom: `1px solid ${c.border}`,
            boxShadow: 'none',
          },
        },
      },
    },
  });
}

// Export default: tema oscuro (no se usa actualmente, pero disponible para importación directa si se necesita)
export default createAppTheme('dark');
