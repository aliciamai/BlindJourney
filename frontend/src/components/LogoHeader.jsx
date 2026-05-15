// ============================================================
// BlindJourney – Cabecera con Logo
// Autora: Alicia Maillo
//
// Componente simple que muestra el logo "BlindJourney" y un tagline.
// Se usa en páginas públicas (login, registro) como encabezado.
// ============================================================

// Box: contenedor flexible de MUI
// Typography: componente de texto con estilos tipográficos
import { Box, Typography } from '@mui/material';

// ── COMPONENTE LOGO HEADER ────────────────────────────────
/**
 * Cabecera con el nombre de la app y un subtítulo personalizable.
 * Props:
 * - tagline: string opcional, subtítulo debajo del logo (default: 'Tu próxima aventura es un misterio')
 *
 * Estilos:
 * - Nombre: fuente Playfair Display (elegante), tamaño grande, color dorado #f0a500
 * - Tagline: gris muted, más pequeño, aparece solo si se proporciona
 */
export default function LogoHeader({ tagline = 'Tu próxima aventura es un misterio' }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      {/* Nombre de la app: BlindJourney */}
      <Typography
        sx={{
          fontFamily: '"Playfair Display", Georgia, serif',  // Fuente elegante
          fontSize: '2rem',
          color: '#f0a500',  // Dorado de marca
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        BlindJourney
      </Typography>

      {/* Tagline (subtítulo) - solo se renderiza si existe */}
      {tagline && (
        <Typography sx={{ fontSize: '0.78rem', color: '#7b8aaa', mt: 0.75 }}>
          {tagline}
        </Typography>
      )}
    </Box>
  );
}
