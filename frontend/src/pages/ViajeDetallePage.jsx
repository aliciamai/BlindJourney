// ============================================================
// BlindJourney – Página de Detalle de Viaje
// Autora: Alicia Maillo
//
// Muestra los detalles de un viaje específico con dos vistas condicionales:
// 1. ModeSorpresa: Viaje aún no revelado
//    - Destino oculto con icono de candado
//    - Countdown hasta la fecha de revelación
//    - Pistas desbloqueadas (clima, idioma, etc.)
// 2. ModeRevelacion: Viaje ya revelado
//    - Destino visible con ciudad y país
//    - Botones a itinerario, álbum, documentos
//    - Información sobre requisitos de entrada
//
// Concepto clave: Renderizado condicional basado en viaje.destino_revelado
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent,
  CircularProgress, Alert, Chip, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MapIcon from '@mui/icons-material/Map';
import LockIcon from '@mui/icons-material/Lock';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useTranslation } from 'react-i18next';
import { getViaje, revelarViaje } from '../api/viajes';
import CountdownTimer from '../components/CountdownTimer';

function ModeSorpresa({ viaje, onRevelar, loadingRevelar, t }) {
  const pistas = viaje.candidatos?.filter((c) => c.seleccionado)?.[0];

  return (
    <Box>
      <Typography sx={{
        fontFamily: '"Playfair Display", serif', fontSize: '1.3rem',
        color: 'var(--bj-text)', textAlign: 'center', mb: 0.5,
      }}>
        {t('tripDetail.surprise.title')}
      </Typography>
      <Typography sx={{ fontSize: '0.78rem', color: 'var(--bj-text-muted)', textAlign: 'center', mb: 0.5 }}>
        {t('tripDetail.surprise.subtitle')}
      </Typography>

      {viaje.revelar_en && <CountdownTimer targetDate={viaje.revelar_en} />}

      <Box sx={{
        background: 'linear-gradient(135deg, var(--bj-surface2), var(--bj-surface))',
        border: '1px solid #f0a500', borderRadius: 2, p: 3, textAlign: 'center',
        my: 2, position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', fontSize: '8rem', color: 'rgba(240,165,0,0.04)',
          fontFamily: '"Playfair Display", serif', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', lineHeight: 1, userSelect: 'none',
        }}>?</Box>
        <LockIcon sx={{ fontSize: 36, color: '#f0a500', position: 'relative' }} />
        <Typography sx={{
          fontFamily: '"Playfair Display", serif', fontSize: '1.1rem',
          color: '#f0a500', mt: 0.75, position: 'relative',
        }}>
          {t('tripDetail.surprise.secretDest')}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'var(--bj-text-muted)', position: 'relative' }}>
          {t('tripDetail.surprise.preparing')}
        </Typography>
      </Box>

      {pistas && (
        <>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--bj-text)', mb: 1 }}>
            {t('tripDetail.surprise.clues')}
          </Typography>
          {pistas.clima && (
            <Card sx={{ mb: 1.5, bgcolor: 'var(--bj-surface)', border: '1px solid var(--bj-border)' }}>
              <CardContent sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Typography sx={{ fontSize: '1.3rem' }}>🌡</Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--bj-text)' }}>
                    {t('tripDetail.surprise.weather')}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>{pistas.clima}</Typography>
                </Box>
              </CardContent>
            </Card>
          )}
          {pistas.idioma && (
            <Card sx={{ mb: 1.5, bgcolor: 'var(--bj-surface)', border: '1px solid var(--bj-border)' }}>
              <CardContent sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Typography sx={{ fontSize: '1.3rem' }}>🗣</Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--bj-text)' }}>
                    {t('tripDetail.surprise.language')}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>{pistas.idioma}</Typography>
                </Box>
              </CardContent>
            </Card>
          )}
          <Card sx={{ mb: 1.5, opacity: 0.45, bgcolor: 'var(--bj-surface)', border: '1px solid var(--bj-border)' }}>
            <CardContent sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '1.3rem' }}>🚩</Typography>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--bj-text)' }}>
                  {t('tripDetail.surprise.flag')}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>
                  {t('tripDetail.surprise.flagLocked')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      <Button variant="outlined" fullWidth onClick={onRevelar} disabled={loadingRevelar}
        sx={{ borderColor: '#f0a500', color: '#f0a500', mt: 1 }}>
        {loadingRevelar
          ? <CircularProgress size={18} sx={{ color: '#f0a500' }} />
          : t('tripDetail.surprise.revealBtn')}
      </Button>
    </Box>
  );
}

function ModeRevelacion({ viaje, onVerItinerario, t }) {
  const reserva = viaje.reservas?.[0] || null;
  const locale = t('common.locale', 'es-ES');
  const fechaInicio = viaje.fecha_inicio
    ? new Date(viaje.fecha_inicio).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const fechaFin = viaje.fecha_fin
    ? new Date(viaje.fecha_fin).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
    : '';

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(61,220,132,0.06), rgba(100,149,237,0.06))',
        border: '1px solid var(--bj-success)', borderRadius: 2, p: 3, textAlign: 'center', mb: 2,
      }}>
        <Typography sx={{ fontSize: '3rem', lineHeight: 1, mb: 0.75 }}>✈</Typography>
        <Typography sx={{
          fontFamily: '"Playfair Display", serif', fontSize: '1.6rem',
          color: 'var(--bj-success)', mb: 0.25,
        }}>
          ¡{viaje.destino_ciudad}!
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)' }}>
          {viaje.destino_pais} · {fechaInicio} — {fechaFin}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
        <Card sx={{ textAlign: 'center', bgcolor: 'var(--bj-surface)', border: '1px solid var(--bj-border)' }}>
          <CardContent sx={{ py: 1.5, px: 1 }}>
            <FlightIcon sx={{ color: '#f0a500', fontSize: 24, mb: 0.5 }} />
            <Typography sx={{ fontSize: '0.65rem', color: 'var(--bj-text-muted)' }}>{t('tripDetail.revealed.flight')}</Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bj-text)' }}>
              {reserva?.codigo_reserva_vuelo || t('tripDetail.revealed.toBeConfirmed')}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ textAlign: 'center', bgcolor: 'var(--bj-surface)', border: '1px solid var(--bj-border)' }}>
          <CardContent sx={{ py: 1.5, px: 1 }}>
            <HotelIcon sx={{ color: '#f0a500', fontSize: 24, mb: 0.5 }} />
            <Typography sx={{ fontSize: '0.65rem', color: 'var(--bj-text-muted)' }}>{t('tripDetail.revealed.hotel')}</Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bj-text)' }}>
              {reserva?.alojamiento || t('tripDetail.revealed.toBeConfirmed')}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 2, bgcolor: 'var(--bj-surface)', border: '1px solid var(--bj-border)' }}>
        <CardContent sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <AssignmentIcon sx={{ color: '#f0a500', fontSize: 20, mt: 0.25 }} />
            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--bj-text)', mb: 0.5 }}>
                {t('tripDetail.revealed.entryReqs')}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>
                {t('tripDetail.revealed.entryReqsText')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Button variant="contained" fullWidth startIcon={<MapIcon />}
        onClick={onVerItinerario} sx={{ mb: 1.5 }}>
        {t('tripDetail.revealed.viewItinerary')}
      </Button>

      <Button variant="outlined" fullWidth
        sx={{ borderColor: 'var(--bj-border)', color: 'var(--bj-text-muted)' }}>
        {t('tripDetail.revealed.downloadDocs')}
      </Button>
    </Box>
  );
}

export default function ViajeDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [viaje, setViaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingRevelar, setLoadingRevelar] = useState(false);

  useEffect(() => {
    getViaje(id)
      .then((data) => setViaje(data.viaje || data))
      .catch(() => setError(t('common.error', 'Error')))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleRevelar = async () => {
    setLoadingRevelar(true);
    try {
      const idioma = localStorage.getItem('bj_lang') || 'es';
      const data = await revelarViaje(id, idioma);
      setViaje((v) => ({ ...v, ...data.viaje, destino_revelado: true }));
    } catch (e) {
      setError(e.response?.data?.mensaje || t('common.error', 'Error'));
    } finally {
      setLoadingRevelar(false);
    }
  };

  const statusLabel = {
    pendiente: t('common.pending'),
    confirmado: t('common.confirmed'),
    revelado: t('common.revealed'),
    completado: t('common.completed'),
    cancelado: t('common.cancelled'),
  };

  return (
    <Box sx={{ px: 2, pt: 2, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: '#f0a500' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: 'var(--bj-text)' }}>
          {viaje?.destino_revelado && viaje?.destino_ciudad
            ? viaje.destino_ciudad
            : t('tripDetail.yourTrip')}
        </Typography>
        {viaje?.estado && (
          <Chip
            label={statusLabel[viaje.estado] || viaje.estado}
            size="small"
            sx={{
              ml: 'auto', fontSize: '0.62rem',
              bgcolor: viaje.destino_revelado ? 'rgba(61,220,132,0.15)' : 'rgba(240,165,0,0.15)',
              color: viaje.destino_revelado ? 'var(--bj-success)' : '#f0a500',
            }}
          />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#f0a500' }} />
        </Box>
      ) : viaje ? (
        viaje.destino_revelado ? (
          <ModeRevelacion viaje={viaje} onVerItinerario={() => navigate(`/viajes/${id}/itinerario`)} t={t} />
        ) : (
          <ModeSorpresa viaje={viaje} onRevelar={handleRevelar} loadingRevelar={loadingRevelar} t={t} />
        )
      ) : null}
    </Box>
  );
}
