// ============================================================
// BlindJourney – Página 404
// Autora: Alicia Maillo
//
// Página que se muestra cuando el usuario intenta acceder a una ruta
// que no existe. Es la catch-all de todas las rutas (`path: '*'` en el router).
// ============================================================

import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// ── COMPONENTE PÁGINA 404 ────────────────────────────────
export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: 'background.default',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      px: 3, textAlign: 'center',
    }}>
      <Typography sx={{
        fontFamily: '"Playfair Display", serif', fontSize: '4rem',
        color: '#f0a500', lineHeight: 1, mb: 1,
      }}>
        404
      </Typography>
      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: 'var(--bj-text)', mb: 0.75 }}>
        {t('common.notFound')}
      </Typography>
      <Typography sx={{ fontSize: '0.82rem', color: 'var(--bj-text-muted)', mb: 3 }}>
        {t('common.notFoundDesc')}
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        {t('common.backHome')}
      </Button>
    </Box>
  );
}
