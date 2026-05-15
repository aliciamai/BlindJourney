// ============================================================
// BlindJourney – Página de Viajes
// Autora: Alicia Maillo
//
// Lista completa de todos los viajes del usuario, separados en dos secciones:
// - Activos: viajes pendientes, confirmados o revelados (en curso)
// - Historial: viajes completados o cancelados (pasados)
//
// Carga la lista de viajes al montar mediante useEffect.
// Si no hay viajes, muestra un estado vacío con FAB para crear uno nuevo.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Fab, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FlightIcon from '@mui/icons-material/Flight';
import { useTranslation } from 'react-i18next';
import { getViajes } from '../api/viajes';
import ViajeCard from '../components/ViajeCard';

export default function ViajesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getViajes()
      .then((data) => {
        const viajesArray = data?.viajes || data || [];
        console.log('Viajes recibidos:', viajesArray.length, viajesArray);
        setViajes(Array.isArray(viajesArray) ? viajesArray : []);
      })
      .catch((err) => {
        console.error('Error cargando viajes:', err);
        setError(t('common.error', 'Error'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <Box sx={{ px: 2, pt: 2.5, pb: 1 }}>
      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', color: 'var(--bj-text)', mb: 2 }}>
        {t('trips.title')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#f0a500' }} />
        </Box>
      ) : viajes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <FlightIcon sx={{ fontSize: 40, color: 'var(--bj-text-muted)', mb: 1 }} />
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: 'var(--bj-text)', mb: 0.75 }}>
            {t('trips.noTrips')}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)' }}>
            {t('trips.noTripsDesc')}
          </Typography>
        </Box>
      ) : (
        <Box>
          {viajes.map((v) => <ViajeCard key={v.id} viaje={v} />)}
        </Box>
      )}

      <Fab color="primary" onClick={() => navigate('/viajes/nuevo')}
        sx={{ position: 'fixed', bottom: 76, right: 20, bgcolor: '#f0a500', color: '#000',
          '&:hover': { bgcolor: '#e09500' }, boxShadow: '0 4px 20px rgba(240,165,0,0.4)' }}>
        <AddIcon />
      </Fab>
    </Box>
  );
}
