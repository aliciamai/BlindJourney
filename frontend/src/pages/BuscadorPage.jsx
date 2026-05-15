// ============================================================
// BlindJourney – Página de Buscador Integrado
// Autora: Alicia Maillo
//
// Buscador que integra 3 categorías:
// 1. Vuelos: Skyscanner, Google Flights, Kayak
// 2. Hoteles: Booking, Airbnb, Hotels.com
// 3. Experiencias: Viator, GetYourGuide, Civitatis
//
// Conceptos clave:
// - Deep-linking: genera URLs predefinidas para cada proveedor
// - window.open: abre la búsqueda en nueva ventana
// - registrarBusqueda: registra en backend para analytics
// - Estadísticas: muestra historial de búsquedas anteriores
// ============================================================

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Tabs, Tab, TextField, Button,
  CircularProgress, Alert, Divider, Chip,
} from '@mui/material';
import FlightIcon        from '@mui/icons-material/Flight';
import HotelIcon         from '@mui/icons-material/Hotel';
import ExploreIcon       from '@mui/icons-material/Explore';
import OpenInNewIcon     from '@mui/icons-material/OpenInNew';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import { registrarBusqueda, getEstadisticas } from '../api/buscador';

// ── Generadores de deep-links (cliente) ───────────────────────
const links = {
  vuelo: (destino, fechaIda, fechaVuelta, adultos) => ({
    Skyscanner:    `https://www.skyscanner.es/vuelos/mad/${encodeURIComponent(destino.toLowerCase())}?adults=${adultos}${fechaIda ? `&outboundDate=${fechaIda}` : ''}${fechaVuelta ? `&inboundDate=${fechaVuelta}` : ''}`,
    'Google Flights': `https://www.google.com/travel/flights?hl=es&q=vuelos+a+${encodeURIComponent(destino)}`,
    Kayak:         `https://www.kayak.es/flights/MAD-${encodeURIComponent(destino)}/${fechaIda || ''}/${fechaVuelta || ''}/${adultos}adults`,
  }),
  hotel: (destino, checkin, checkout, adultos) => ({
    'Booking.com': `https://www.booking.com/searchresults.es.html?ss=${encodeURIComponent(destino)}&checkin=${checkin || ''}&checkout=${checkout || ''}&group_adults=${adultos}`,
    Airbnb:        `https://www.airbnb.es/s/${encodeURIComponent(destino)}/homes`,
    Hotels:        `https://es.hotels.com/search.do?q-destination=${encodeURIComponent(destino)}&q-check-in=${checkin || ''}&q-check-out=${checkout || ''}`,
  }),
  experiencia: (destino) => ({
    Viator:         `https://www.viator.com/es-ES/search?text=${encodeURIComponent(destino)}`,
    GetYourGuide:   `https://www.getyourguide.es/s/?q=${encodeURIComponent(destino)}`,
    Civitatis:      `https://www.civitatis.com/es/${encodeURIComponent(destino.toLowerCase())}/`,
  }),
};

const PROVEEDOR_COLOR = {
  Skyscanner: '#0770e3', 'Google Flights': '#4285f4', Kayak: '#ff690f',
  'Booking.com': '#003580', Airbnb: '#ff5a5f', Hotels: '#d50000',
  Viator: '#172754', GetYourGuide: '#ff5328', Civitatis: '#f5a623',
};

function ProviderButton({ nombre, url, tipo, destino, onRegistrar }) {
  const color = PROVEEDOR_COLOR[nombre] || '#f0a500';
  const handleClick = async () => {
    try { await onRegistrar(tipo, nombre, destino, url); } catch {}
    window.open(url, '_blank', 'noopener');
  };
  return (
    <Button
      onClick={handleClick}
      variant="outlined"
      endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
      fullWidth
      sx={{
        mb: 1, justifyContent: 'space-between',
        borderColor: `${color}55`, color,
        '&:hover': { borderColor: color, bgcolor: `${color}10` },
        fontSize: '0.82rem', fontWeight: 600, py: 1,
      }}
    >
      {nombre}
    </Button>
  );
}

export default function BuscadorPage() {
  const [searchParams] = useSearchParams();
  const [tab,    setTab]    = useState(0);
  const [destino, setDestino] = useState(searchParams.get('destino') || '');
  const [fechaIda,    setFechaIda]    = useState(searchParams.get('fecha_inicio') || '');
  const [fechaVuelta, setFechaVuelta] = useState(searchParams.get('fecha_fin') || '');
  const [adultos,  setAdultos]  = useState(1);
  const [resultado, setResultado] = useState(null);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');
  const [stats,     setStats]    = useState(null);

  useEffect(() => {
    getEstadisticas().then((d) => setStats(d.stats)).catch(() => {});
  }, []);

  const tipo = ['vuelo', 'hotel', 'experiencia'][tab];

  const buscar = () => {
    if (!destino.trim()) { setError('Introduce un destino'); return; }
    setError('');
    setLoading(true);
    // Links generados en cliente (sin esperar al servidor)
    const resultado = tab === 0
      ? links.vuelo(destino, fechaIda, fechaVuelta, adultos)
      : tab === 1
      ? links.hotel(destino, fechaIda, fechaVuelta, adultos)
      : links.experiencia(destino);
    setTimeout(() => { setResultado(resultado); setLoading(false); }, 300);
  };

  const handleRegistrar = async (tipo, proveedor, destino_ciudad, url_destino) => {
    await registrarBusqueda({ tipo, proveedor, destino_ciudad, url_destino });
    getEstadisticas().then((d) => setStats(d.stats)).catch(() => {});
  };

  return (
    <Box sx={{ px: 2, pt: 2, pb: 10 }}>
      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: 'var(--bj-text)', mb: 0.5 }}>
        Buscador de viajes
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: 'var(--bj-text-muted)', mb: 2 }}>
        Encuentra vuelos, hoteles y experiencias en un clic
      </Typography>

      {/* Tabs */}
      <Tabs
        value={tab} onChange={(_, v) => { setTab(v); setResultado(null); }}
        sx={{
          mb: 2.5, minHeight: 36,
          '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.78rem', color: 'var(--bj-text-muted)' },
          '& .Mui-selected': { color: '#f0a500 !important' },
          '& .MuiTabs-indicator': { bgcolor: '#f0a500' },
        }}
      >
        <Tab icon={<FlightIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Vuelos" />
        <Tab icon={<HotelIcon  sx={{ fontSize: 16 }} />} iconPosition="start" label="Hoteles" />
        <Tab icon={<ExploreIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Experiencias" />
      </Tabs>

      {/* Formulario de búsqueda */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          label="Destino" value={destino}
          onChange={(e) => setDestino(e.target.value)}
          placeholder="ej: París, Tokio, Roma"
          size="small" fullWidth
        />

        {tab !== 2 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label={tab === 0 ? 'Fecha ida' : 'Check-in'}
              type="date" value={fechaIda}
              onChange={(e) => setFechaIda(e.target.value)}
              size="small" fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={tab === 0 ? 'Fecha vuelta' : 'Check-out'}
              type="date" value={fechaVuelta}
              onChange={(e) => setFechaVuelta(e.target.value)}
              size="small" fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        )}

        {tab !== 2 && (
          <TextField
            label="Personas" type="number" value={adultos}
            onChange={(e) => setAdultos(Math.max(1, parseInt(e.target.value) || 1))}
            size="small" inputProps={{ min: 1, max: 10 }}
          />
        )}

        {error && <Alert severity="warning" sx={{ py: 0.5 }}>{error}</Alert>}

        <Button
          variant="contained" fullWidth onClick={buscar} disabled={loading}
          sx={{ bgcolor: '#f0a500', color: '#000', '&:hover': { bgcolor: '#d4920a' }, fontWeight: 700 }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : 'Buscar'}
        </Button>
      </Box>

      {/* Resultados: botones por proveedor */}
      {resultado && (
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--bj-text)', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Comparar en
          </Typography>
          {Object.entries(resultado).map(([nombre, url]) => (
            <ProviderButton
              key={nombre}
              nombre={nombre}
              url={url}
              tipo={tipo}
              destino={destino}
              onRegistrar={handleRegistrar}
            />
          ))}
          <Typography sx={{ fontSize: '0.65rem', color: 'var(--bj-text-muted)', mt: 1, textAlign: 'center' }}>
            BlindJourney puede recibir una comisión cuando reservas a través de estos enlaces
          </Typography>
        </Box>
      )}

      {/* Estadísticas de uso */}
      {stats && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TrendingUpIcon sx={{ fontSize: 18, color: '#f0a500' }} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bj-text)' }}>
              Tus búsquedas
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { label: 'Total', value: stats.total },
              { label: 'Vuelos', value: stats.vuelos },
              { label: 'Hoteles', value: stats.hoteles },
              { label: 'Experiencias', value: stats.experiencias },
            ].map(({ label, value }) => (
              <Chip
                key={label}
                label={`${label}: ${value}`}
                size="small"
                sx={{ bgcolor: 'var(--bj-surface2)', color: 'var(--bj-text)', fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
