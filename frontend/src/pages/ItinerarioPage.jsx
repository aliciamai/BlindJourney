// ============================================================
// BlindJourney – Página del Itinerario
// Autora: Alicia Maillo
//
// Muestra el itinerario del viaje (actividades generadas por IA) en dos vistas:
// 1. Tab "Lista": actividades agrupadas por día, con swipe para marcar/eliminar
// 2. Tab "Mapa": visualización en Google Maps de todas las actividades
//
// Conceptos avanzados:
// - Swipe events: soporta swipe táctil (móvil) y de ratón (desktop)
// - localStorage: guarda hint de que ya vio tutorial de swipe
// - useRef: para rastrear posición de swipe sin re-render
// - Fetch directo: actualiza estado de actividades (PATCH, DELETE)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Alert,
  IconButton, Chip, Divider, Tabs, Tab,
} from '@mui/material';
import ArrowBackIcon       from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon     from '@mui/icons-material/AutoAwesome';
import RefreshIcon         from '@mui/icons-material/Refresh';
import ListIcon            from '@mui/icons-material/FormatListBulleted';
import MapOutlinedIcon     from '@mui/icons-material/MapOutlined';
import DeleteIcon          from '@mui/icons-material/Delete';
import StarIcon            from '@mui/icons-material/Star';
import StarBorderIcon      from '@mui/icons-material/StarBorder';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import { useTranslation }  from 'react-i18next';
import { getItinerario, regenerarItinerario } from '../api/itinerarios';
import client              from '../api/client';
import MapView             from '../components/MapView';

const TIPO_COLOR = {
  cultura:     '#6495ed',
  gastronomia: '#f0a500',
  ocio:        '#c084fc',
  transporte:  'var(--bj-text-muted)',
  alojamiento: 'var(--bj-success)',
  naturaleza:  '#4ade80',
};

const SWIPE_THRESHOLD = 72;

// ── Componente con swipe estilo iOS ──────────────────────────
function SwipeableActivityItem({ actividad, onDelete, onToggleImportant, onToggleCompletada }) {
  const [offset, setOffset]     = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(null);
  const color  = TIPO_COLOR[actividad.tipo] || 'var(--bj-text-muted)';
  const isLeft  = offset < -8;
  const isRight = offset >  8;

  const onStart = (x) => { startX.current = x; setDragging(true); };
  const onMove  = (x) => {
    if (startX.current === null) return;
    const d = x - startX.current;
    setOffset(Math.max(-110, Math.min(110, d)));
  };
  const onEnd = () => {
    if (offset < -SWIPE_THRESHOLD) onDelete(actividad.id);
    else if (offset > SWIPE_THRESHOLD) onToggleImportant(actividad.id, !actividad.importante);
    setOffset(0);
    setDragging(false);
    startX.current = null;
  };

  const bgColor  = isLeft  ? '#e05c5c'
                 : isRight ? (actividad.importante ? '#c084fc' : '#f0a500')
                 : 'transparent';
  const bgOpacity = Math.min(Math.abs(offset) / SWIPE_THRESHOLD, 1);

  return (
    <Box sx={{ position: 'relative', mb: 1, borderRadius: 1.5, overflow: 'hidden', userSelect: 'none' }}>
      {/* Fondo de acción */}
      <Box sx={{
        position: 'absolute', inset: 0, borderRadius: 1.5,
        bgcolor: bgColor,
        opacity: bgOpacity,
        display: 'flex', alignItems: 'center',
        justifyContent: isLeft ? 'flex-end' : 'flex-start',
        px: 2,
        transition: dragging ? 'none' : 'opacity 0.2s',
      }}>
        {isLeft  && <DeleteIcon sx={{ color: '#fff', fontSize: 22 }} />}
        {isRight && (actividad.importante
          ? <StarIcon sx={{ color: '#fff', fontSize: 22 }} />
          : <StarBorderIcon sx={{ color: '#fff', fontSize: 22 }} />)}
      </Box>

      {/* Contenido deslizable */}
      <Box
        sx={{
          display: 'flex', gap: 1.5, p: 1.25,
          bgcolor: actividad.completada ? 'rgba(61,220,132,0.07)' : 'var(--bj-surface)',
          borderRadius: 1.5,
          border: `1px solid var(--bj-border)`,
          borderLeftColor: color,
          borderLeftWidth: 2,
          position: 'relative', zIndex: 1,
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(.25,.46,.45,.94)',
          opacity: actividad.completada ? 0.6 : 1,
          cursor: 'grab',
        }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e)  => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e)  => onStart(e.clientX)}
        onMouseMove={(e)  => dragging && onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        <Typography sx={{ fontSize: '0.68rem', color: 'var(--bj-text-muted)', width: 36, flexShrink: 0, pt: 0.25 }}>
          {actividad.hora || '--:--'}
        </Typography>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {actividad.importante && (
              <StarIcon sx={{ fontSize: 13, color: '#f0a500' }} />
            )}
            <Typography sx={{
              fontSize: '0.82rem', fontWeight: 500, color: 'var(--bj-text)',
              textDecoration: actividad.completada ? 'line-through' : 'none',
            }}>
              {actividad.nombre}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.25, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.68rem', color: 'var(--bj-text-muted)' }}>
              {actividad.tipo}
            </Typography>
            {actividad.ubicacion && (
              <Typography sx={{ fontSize: '0.68rem', color: 'var(--bj-text-muted)' }}>
                · 📍 {actividad.ubicacion}
              </Typography>
            )}
            {actividad.duracion_minutos && (
              <Typography sx={{ fontSize: '0.68rem', color: 'var(--bj-text-muted)' }}>
                · ⏱ {actividad.duracion_minutos}min
              </Typography>
            )}
            {actividad.coste_estimado > 0 && (
              <Chip
                label={`${actividad.coste_estimado}€`} size="small"
                sx={{ height: 16, fontSize: '0.6rem', bgcolor: 'rgba(240,165,0,0.12)', color: '#f0a500' }}
              />
            )}
          </Box>
          {actividad.descripcion && (
            <Typography sx={{ fontSize: '0.68rem', color: 'var(--bj-text-muted)', mt: 0.5 }}>
              {actividad.descripcion}
            </Typography>
          )}
        </Box>

        {/* Botón completada */}
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onToggleCompletada(actividad.id, !actividad.completada); }}
          sx={{ color: actividad.completada ? 'var(--bj-success)' : 'var(--bj-border)', p: 0.25, alignSelf: 'flex-start' }}
        >
          <CheckCircleIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

// ── Hint de swipe (aparece una vez) ──────────────────────────
function SwipeHint() {
  const [visible, setVisible] = useState(!localStorage.getItem('bj_swipe_hint'));
  if (!visible) return null;
  return (
    <Box
      onClick={() => { localStorage.setItem('bj_swipe_hint', '1'); setVisible(false); }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: 1.5, py: 0.75, mb: 1.5, borderRadius: 2,
        bgcolor: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.25)',
        cursor: 'pointer',
      }}
    >
      <Typography sx={{ fontSize: '0.7rem', color: '#f0a500' }}>
        ← Desliza para eliminar &nbsp;·&nbsp; Desliza → para marcar importante &nbsp;·&nbsp; ✓ para completar
      </Typography>
    </Box>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function ItinerarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [itinerario,  setItinerario]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [regenerando, setRegenerando] = useState(false);
  const [error,       setError]       = useState('');
  const [tab,         setTab]         = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    getItinerario(id)
      .then((data) => setItinerario(data.itinerario || data))
      .catch(() => setError(t('common.error', 'Error')))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(load, [load]);

  const handleRegenerar = async () => {
    setRegenerando(true); setError('');
    try {
      const data = await regenerarItinerario(id);
      setItinerario(data.itinerario || data);
    } catch (e) {
      setError(e.response?.data?.error || t('common.error', 'Error'));
    } finally {
      setRegenerando(false);
    }
  };

  // ── Acciones sobre actividades ────────────────────────────
  const patchActividad = async (actividadId, campos) => {
    await client.patch(`/itinerarios/actividades/${actividadId}`, campos);
    setItinerario((prev) => ({
      ...prev,
      actividades: prev.actividades.map((a) =>
        a.id === actividadId ? { ...a, ...campos } : a
      ),
    }));
  };

  const handleDelete = async (actividadId) => {
    await client.delete(`/itinerarios/actividades/${actividadId}`);
    setItinerario((prev) => ({
      ...prev,
      actividades: prev.actividades.filter((a) => a.id !== actividadId),
    }));
  };

  const handleToggleImportant  = (id, val) => patchActividad(id, { importante: val });
  const handleToggleCompletada = (id, val) => patchActividad(id, { completada: val });

  const actividades = itinerario?.actividades || [];
  const diasMap = {};
  actividades.forEach((a) => {
    if (!diasMap[a.dia]) diasMap[a.dia] = [];
    diasMap[a.dia].push(a);
  });
  const dias = Object.keys(diasMap).sort((a, b) => Number(a) - Number(b));

  const destino  = itinerario?.destino_ciudad
    ? `${itinerario.destino_ciudad}, ${itinerario.destino_pais}`
    : t('itinerary.tabList');
  const destCity = itinerario?.destino_ciudad
    ? `${itinerario.destino_ciudad}, ${itinerario.destino_pais}`
    : '';

  return (
    <Box sx={{ px: 2, pt: 2, pb: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: '#f0a500' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: 'var(--bj-text)' }}>
            {destino}
          </Typography>
        </Box>
        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: 'var(--bj-success) !important' }} />}
          label="IA" size="small"
          sx={{ bgcolor: 'rgba(61,220,132,0.15)', color: 'var(--bj-success)', fontSize: '0.65rem', height: 22 }}
        />
      </Box>

      {itinerario && (
        <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)', mb: 1.5, pl: 5 }}>
          {t('itinerary.subtitle')}
        </Typography>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#f0a500' }} />
        </Box>
      ) : actividades.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <AutoAwesomeIcon sx={{ fontSize: 40, color: 'var(--bj-text-muted)', mb: 1 }} />
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: 'var(--bj-text)', mb: 0.75 }}>
            {t('itinerary.noItinerary')}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)', mb: 2 }}>
            {t('itinerary.noItineraryDesc')}
          </Typography>
          <Button variant="contained" startIcon={<AutoAwesomeIcon />}
            onClick={handleRegenerar} disabled={regenerando}>
            {regenerando ? <CircularProgress size={18} sx={{ color: '#000' }} /> : t('itinerary.generate')}
          </Button>
        </Box>
      ) : (
        <>
          <Tabs
            value={tab} onChange={(_, v) => setTab(v)}
            sx={{
              mb: 2, minHeight: 36,
              '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.8rem', color: 'var(--bj-text-muted)' },
              '& .Mui-selected': { color: '#f0a500 !important' },
              '& .MuiTabs-indicator': { bgcolor: '#f0a500' },
            }}
          >
            <Tab icon={<ListIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={t('itinerary.tabList')} />
            <Tab icon={<MapOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={t('itinerary.tabMap')} />
          </Tabs>

          {tab === 0 && (
            <>
              <SwipeHint />
              {dias.map((dia) => (
                <Box key={dia}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, mb: 1.25 }}>
                    <Box sx={{
                      width: 26, height: 26, borderRadius: '50%', bgcolor: '#f0a500',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#000' }}>{dia}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bj-text)' }}>
                      {t('itinerary.day')} {dia}
                    </Typography>
                  </Box>
                  {diasMap[dia]
                    .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
                    .map((actividad) => (
                      <SwipeableActivityItem
                        key={actividad.id}
                        actividad={actividad}
                        onDelete={handleDelete}
                        onToggleImportant={handleToggleImportant}
                        onToggleCompletada={handleToggleCompletada}
                      />
                    ))}
                </Box>
              ))}

              <Divider sx={{ my: 2.5 }} />

              <Button variant="outlined" fullWidth
                startIcon={regenerando ? <CircularProgress size={16} sx={{ color: 'var(--bj-text-muted)' }} /> : <RefreshIcon />}
                onClick={handleRegenerar} disabled={regenerando}
                sx={{ borderColor: 'var(--bj-border)', color: 'var(--bj-text-muted)' }}>
                {regenerando ? t('itinerary.regenerating') : t('itinerary.regenerate')}
              </Button>
            </>
          )}

          {tab === 1 && (
            <MapView activities={actividades} destCity={destCity} />
          )}
        </>
      )}
    </Box>
  );
}
