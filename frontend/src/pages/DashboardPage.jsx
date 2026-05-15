// ============================================================
// BlindJourney – Página Dashboard (Inicio)
// Autora: Alicia Maillo
//
// Página principal post-login que muestra:
// - Saludo contextual (buenos días/tardes/noches)
// - Avatar del usuario (clickable → perfil)
// - Próximo viaje en formato especial (ProximoViajeCard)
// - Historial de viajes pasados (completados/cancelados)
// - Botón FAB para crear nuevo viaje
//
// Lógica: filtra viajes en "activos" e "historial" según estado
// ============================================================

// useState: estado local de viajes y carga
// useEffect: carga la lista de viajes al montar
import { useState, useEffect } from 'react';
// useNavigate: para navegar a other páginas
import { useNavigate } from 'react-router-dom';
// MUI components
import {
  Box, Typography, Button, Card, CardContent,
  CircularProgress, Chip, Avatar,
} from '@mui/material';
// Iconos
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
// Traducciones
import { useTranslation } from 'react-i18next';
// API para obtener viajes
import { getViajes } from '../api/viajes';
// Hook de autenticación para acceder al nombre del usuario
import { useAuth } from '../context/AuthContext';
// Componentes para mostrar viajes
import ViajeCard from '../components/ViajeCard';
import CountdownTimer from '../components/CountdownTimer';

// ── FUNCIÓN AUXILIAR: Saludo Contextual ────────────────────
/**
 * Devuelve un saludo según la hora del día.
 * Parámetros: t (función de traducción)
 * Devuelve: string traducido ("Buenos días", "Buenas tardes", "Buenas noches")
 *
 * Rangos horarios:
 * - 0-12: mañana
 * - 13-19: tarde
 * - 20-23: noche
 */
function getHoraDelDia(t) {
  const h = new Date().getHours();
  if (h < 13) return t('dashboard.goodMorning');
  if (h < 20) return t('dashboard.goodAfternoon');
  return t('dashboard.goodEvening');
}

function ProximoViajeCard({ viaje, onNavigate, t }) {
  const isRevelado = viaje.destino_revelado;

  if (isRevelado) {
    return (
      <Card sx={{ mb: 2.5, border: '1px solid var(--bj-success)', background: 'linear-gradient(135deg, rgba(61,220,132,0.06), rgba(100,149,237,0.06))' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'var(--bj-success)', fontWeight: 700, mb: 1 }}>
            ✈ {t('dashboard.nextTripRevealed')}
          </Typography>
          <Box sx={{ textAlign: 'center', py: 1.5 }}>
            <Typography sx={{ fontSize: '2.5rem', lineHeight: 1 }}>✈</Typography>
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', color: 'var(--bj-success)', mt: 0.5 }}>
              {viaje.destino_ciudad}, {viaje.destino_pais}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
            {viaje.fecha_inicio && (
              <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>
                📅{' '}
                {new Date(viaje.fecha_inicio).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                {' — '}
                {new Date(viaje.fecha_fin).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </Typography>
            )}
            <Chip label={t('common.revealed')} size="small"
              sx={{ bgcolor: 'rgba(61,220,132,0.15)', color: 'var(--bj-success)', fontSize: '0.62rem', height: 20 }} />
          </Box>
          <Button variant="contained" fullWidth size="small"
            onClick={() => onNavigate(`/viajes/${viaje.id}/itinerario`)} sx={{ mt: 1.5 }}>
            {t('dashboard.viewItinerary')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2.5, border: '1px solid #f0a500', background: 'rgba(240,165,0,0.04)' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography sx={{ fontSize: '0.7rem', color: '#f0a500', fontWeight: 700, mb: 1 }}>
          ✈ {t('dashboard.nextTrip')}
        </Typography>
        <Box sx={{
          background: 'linear-gradient(135deg, var(--bj-surface2), var(--bj-surface))',
          border: '1px solid #f0a500', borderRadius: 2, p: 2.5, textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', fontSize: '7rem', color: 'rgba(240,165,0,0.04)',
            fontFamily: '"Playfair Display", serif', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)', lineHeight: 1, userSelect: 'none' }}>?</Box>
          <LockIcon sx={{ fontSize: 32, color: '#f0a500', position: 'relative' }} />
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: '#f0a500', mt: 0.5, position: 'relative' }}>
            {t('dashboard.hiddenDest')}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)', position: 'relative' }}>
            {viaje.revelar_en ? t('dashboard.revealCountdown') : t('dashboard.destConfirmed')}
          </Typography>
        </Box>

        {viaje.revelar_en && <CountdownTimer targetDate={viaje.revelar_en} />}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          {viaje.fecha_inicio && (
            <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>
              📅{' '}
              {new Date(viaje.fecha_inicio).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              {' — '}
              {new Date(viaje.fecha_fin).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </Typography>
          )}
          <Chip
            label={viaje.estado === 'confirmado' ? t('common.confirmed') : t('common.pending')}
            size="small"
            sx={{
              bgcolor: viaje.estado === 'confirmado' ? 'rgba(61,220,132,0.15)' : 'rgba(240,165,0,0.15)',
              color: viaje.estado === 'confirmado' ? 'var(--bj-success)' : '#f0a500',
              fontSize: '0.62rem', height: 20,
            }}
          />
        </Box>
        <Button variant="outlined" fullWidth size="small"
          onClick={() => onNavigate(`/viajes/${viaje.id}`)}
          sx={{ mt: 1.5, borderColor: 'var(--bj-border)', color: 'var(--bj-text-muted)' }}>
          {t('dashboard.viewDetails')}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getViajes()
      .then((data) => setViajes(Array.isArray(data) ? data : data.viajes || []))
      .catch(() => setViajes([]))
      .finally(() => setLoading(false));
  }, []);

  const activos  = viajes.filter((v) => ['pendiente', 'confirmado', 'revelado'].includes(v.estado));
  const historial = viajes.filter((v) => ['completado', 'cancelado'].includes(v.estado));
  const proximoViaje = activos[0] || null;
  const nombre = user?.nombre || 'Viajero';
  const initials = (nombre.charAt(0) + (user?.apellidos?.charAt(0) || '')).toUpperCase();

  return (
    <Box sx={{ px: 2, pt: 2.5, pb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>
            {getHoraDelDia(t)},
          </Typography>
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', color: 'var(--bj-text)', lineHeight: 1.2 }}>
            {nombre} 👋
          </Typography>
        </Box>
        <Avatar onClick={() => navigate('/perfil')}
          sx={{ width: 38, height: 38, bgcolor: '#f0a500', color: '#000', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
          {initials}
        </Avatar>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#f0a500' }} />
        </Box>
      ) : (
        <>
          {proximoViaje ? (
            <ProximoViajeCard viaje={proximoViaje} onNavigate={navigate} t={t} />
          ) : (
            <Card sx={{ mb: 2.5, border: '1px dashed var(--bj-border)', bgcolor: 'transparent' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>✈</Typography>
                <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: 'var(--bj-text)', mb: 0.5 }}>
                  {t('dashboard.noActiveTrips')}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'var(--bj-text-muted)' }}>
                  {t('dashboard.noActiveTripsDesc')}
                </Typography>
              </CardContent>
            </Card>
          )}

          {historial.length > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bj-text)' }}>
                  {t('dashboard.myTrips')}
                </Typography>
                <Typography onClick={() => navigate('/viajes')}
                  sx={{ fontSize: '0.75rem', color: '#f0a500', cursor: 'pointer' }}>
                  {t('dashboard.viewAll')}
                </Typography>
              </Box>
              {historial.slice(0, 3).map((v) => <ViajeCard key={v.id} viaje={v} />)}
            </>
          )}

          <Button variant="contained" fullWidth startIcon={<AddIcon />}
            onClick={() => navigate('/viajes/nuevo')} sx={{ mt: historial.length ? 1 : 0 }}>
            {t('dashboard.newTrip')}
          </Button>
        </>
      )}
    </Box>
  );
}
