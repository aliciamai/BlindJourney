// ============================================================
// BlindJourney – Tarjeta de Viaje
// Autora: Alicia Maillo
//
// Componente que renderiza un viaje en formato "boarding pass" (tarjeta de avión).
// Se usa en DashboardPage, ViajesPage y otros lugares para mostrar viajes.
// Estéticamente imita a un ticket de avión con:
// - Franja de color superior según estado
// - Información de origen/destino en el centro
// - Línea punteada (tear line) en el medio
// - Detalles de fecha y duración en la parte inferior
// ============================================================

// useNavigate: para navegar a /viajes/:id al hacer clic en la tarjeta
import { useNavigate } from 'react-router-dom';
// MUI components para construir la UI
import { Box, Typography, Chip } from '@mui/material';
// Icono de avión
import FlightIcon from '@mui/icons-material/Flight';
// Icono de candado (para destinos no revelados)
import LockIcon from '@mui/icons-material/Lock';
// Traducciones
import { useTranslation } from 'react-i18next';

// ── MAPEO DE ESTADOS A COLORES ─────────────────────────────
/**
 * Configuración visual para cada estado de viaje.
 * Color: código de color hexadecimal o variable CSS
 * - pendiente: dorado (en espera de confirmación)
 * - confirmado: verde (reserva confirmada)
 * - revelado: azul (destino ya revelado)
 * - completado: verde (viaje finalizado)
 * - cancelado: rojo (viaje cancelado)
 */
const ESTADO = {
  pendiente:  { color: '#f0a500', label: null },  // Dorado
  confirmado: { color: 'var(--bj-success)', label: null },  // Verde
  revelado:   { color: '#6495ed', label: null },  // Azul
  completado: { color: 'var(--bj-success)', label: null },  // Verde
  cancelado:  { color: '#e05c5c', label: null },  // Rojo
};

// ── COMPONENTE TARJETA DE VIAJE ───────────────────────────
/**
 * Renderiza un viaje en forma de tarjeta tipo "boarding pass".
 * Props:
 * - viaje: objeto con { id, estado, fecha_inicio, fecha_fin, destino_ciudad, destino_pais, destino_revelado, duracion }
 *
 * Características:
 * - Clicable: navega a /viajes/:id
 * - Estados visuales: color de franja superior según estado
 * - Destino oculto: muestra "???" y icono de candado si no revelado
 * - Destino revelado: muestra código de 3 letras (ej. "PAR" para París)
 */
export default function ViajeCard({ viaje }) {
  // Para navegar al detalle del viaje al hacer clic
  const navigate = useNavigate();
  // Acceso a traducciones
  const { t } = useTranslation();

  // ── CONFIGURACIÓN VISUAL ────────────────────────────────
  // Obtiene el color según el estado actual (fallback a pendiente si estado desconocido)
  const estadoConfig = ESTADO[viaje.estado] || ESTADO.pendiente;
  const accentColor  = estadoConfig.color;

  // ── FORMATEO DE FECHAS ──────────────────────────────────
  // Convierte las fechas a formato legible en español (ej. "15 may" o "15 may 2026")
  const fechaInicio = viaje.fecha_inicio
    ? new Date(viaje.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const fechaFin = viaje.fecha_fin
    ? new Date(viaje.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null;

  // ── INFORMACIÓN DEL DESTINO ─────────────────────────────
  // Si el viaje está revelado: código de 3 letras (MAD, PAR, etc.)
  // Si no está revelado: "???" para mantener el misterio
  const destino   = viaje.destino_revelado && viaje.destino_ciudad
    ? viaje.destino_ciudad.toUpperCase().substring(0, 3)
    : '???';
  // Nombre completo del destino o texto "Destino oculto"
  const destinoFull = viaje.destino_revelado && viaje.destino_ciudad
    ? `${viaje.destino_ciudad}, ${viaje.destino_pais}`
    : t('common.hiddenDest');

  // Etiqueta del estado en el idioma seleccionado
  const estadoLabel = t(`common.${viaje.estado}`, viaje.estado);

  // ── RENDER: Tarjeta de viaje estilo "boarding pass" ──────
  return (
    <Box
      onClick={() => navigate(`/viajes/${viaje.id}`)}  // Navega al detalle del viaje
      sx={{
        mb: 2,
        cursor: 'pointer',
        bgcolor: 'var(--bj-surface)',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid var(--bj-border)',
        // Animación suave al pasar el mouse: sube 2px y agrega sombra
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform:  'translateY(-2px)',
          boxShadow: `0 6px 24px rgba(0,0,0,0.18)`,
        },
      }}
    >
      {/* Franja superior de color (identificador visual del estado) */}
      <Box sx={{ height: 3, bgcolor: accentColor }} />

      {/* Cuerpo principal del ticket */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1.25 }}>

        {/* Fila superior: aerolínea + estado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
            color: 'var(--bj-text-muted)', textTransform: 'uppercase',
          }}>
            BlindJourney · BJ#{String(viaje.id).padStart(4, '0')}
          </Typography>
          <Chip
            label={estadoLabel}
            size="small"
            sx={{
              height: 18, fontSize: '0.58rem', fontWeight: 700,
              bgcolor: `${accentColor}20`, color: accentColor,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}
          />
        </Box>

        {/* Ruta: MAD → DEST */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {/* Origen */}
          <Box sx={{ textAlign: 'center', minWidth: 44 }}>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1, color: 'var(--bj-text)', fontFamily: '"Playfair Display", serif' }}>
              MAD
            </Typography>
            <Typography sx={{ fontSize: '0.58rem', color: 'var(--bj-text-muted)', mt: 0.25 }}>
              Madrid
            </Typography>
          </Box>

          {/* Línea de vuelo */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ flex: 1, height: '1px', borderTop: '1.5px dashed var(--bj-border)' }} />
            <FlightIcon sx={{ fontSize: 16, color: accentColor, transform: 'rotate(90deg)' }} />
            <Box sx={{ flex: 1, height: '1px', borderTop: '1.5px dashed var(--bj-border)' }} />
          </Box>

          {/* Destino */}
          <Box sx={{ textAlign: 'center', minWidth: 44 }}>
            {viaje.destino_revelado
              ? <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1, color: accentColor, fontFamily: '"Playfair Display", serif' }}>
                  {destino}
                </Typography>
              : <LockIcon sx={{ fontSize: 22, color: 'var(--bj-text-muted)' }} />}
            <Typography sx={{ fontSize: '0.58rem', color: 'var(--bj-text-muted)', mt: 0.25, maxWidth: 60, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {destinoFull}
            </Typography>
          </Box>
        </Box>

        {/* Línea de puntos (tear line) */}
        <Box sx={{
          mx: -2, my: 0,
          display: 'flex', alignItems: 'center',
          position: 'relative',
        }}>
          <Box sx={{
            width: 12, height: 12, borderRadius: '50%',
            bgcolor: 'var(--bj-bg)',
            border: '1px solid var(--bj-border)',
            flexShrink: 0, ml: '-6px',
          }} />
          <Box sx={{ flex: 1, borderTop: '1.5px dashed var(--bj-border)' }} />
          <Box sx={{
            width: 12, height: 12, borderRadius: '50%',
            bgcolor: 'var(--bj-bg)',
            border: '1px solid var(--bj-border)',
            flexShrink: 0, mr: '-6px',
          }} />
        </Box>

        {/* Franja inferior: detalles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.25 }}>
          {fechaInicio && (
            <Box>
              <Typography sx={{ fontSize: '0.58rem', color: 'var(--bj-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Salida
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--bj-text)' }}>
                {fechaInicio}
              </Typography>
            </Box>
          )}
          {viaje.duracion && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.58rem', color: 'var(--bj-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Duración
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--bj-text)' }}>
                {viaje.duracion} días
              </Typography>
            </Box>
          )}
          {fechaFin && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.58rem', color: 'var(--bj-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Regreso
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--bj-text)' }}>
                {fechaFin}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
