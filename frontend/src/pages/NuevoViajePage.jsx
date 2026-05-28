// ============================================================
// BlindJourney – Página de Creación de Nuevo Viaje
// Autora: Alicia Maillo
//
// Página del wizard de 5 pasos para crear un viaje "blind" (ciego/sorpresa).
// Pasos:
// 0. StepFechas: seleccionar fechas (mín 3 días, máx 30) y número de viajeros
// 1. StepPresupuesto: elegir rango presupuestario (económico, estándar, premium)
// 2. StepPreferencias: seleccionar intereses, alojamiento, dieta, nivel de actividad
//    → aquí se genera el viaje y se obtienen candidatos de destino
// 3. StepDestinos: lista de destinos candidatos para vetar los no deseados
// 4. StepConfirmar: resumen final y creación de reserva
//
// Persistencia: sessionStorage guarda el estado del wizard para permitir
// navegación hacia atrás sin perder datos (se borra al confirmar)
// ============================================================

// useState: estado del wizard y datos
// useEffect: carga perfil del usuario
import { useState, useEffect } from 'react';
// useNavigate: para redirigir post-confirmación
import { useNavigate } from 'react-router-dom';
// MUI components
import {
  Box, Typography, Button, IconButton, Chip, Slider,
  CircularProgress, Alert, TextField, Card, CardContent,
  Stepper, Step, StepLabel, Snackbar,
} from '@mui/material';
// Iconos
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
// Date pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// Librería de fechas (compatible con date pickers de MUI)
import dayjs from 'dayjs';
import 'dayjs/locale/es';
// Traducciones
import { useTranslation } from 'react-i18next';
// APIs
import { crearViaje, vetarCandidato } from '../api/viajes';
import { getPerfil, actualizarPerfil } from '../api/perfil';
import { crearReserva, simularPago } from '../api/reservas';

// ── MAPEO BIDIRECCIONAL: ENUM Nivel de Actividad ↔ Slider ──
/**
 * El backend usa un ENUM para el nivel de actividad del usuario:
 * 'tranquilo' | 'moderado' | 'activo' | 'aventurero'
 *
 * El frontend renderiza un slider (1-4) para que sea más intuitivo.
 * Este mapeo convierte entre ambos formatos.
 *
 * enumToSlider: convierte enum string a slider 1-4
 * sliderToEnum: convierte slider 1-4 a enum string
 */
const ACTIVITY_ENUM = ['tranquilo', 'moderado', 'activo', 'aventurero'];
const enumToSlider  = (v) => Math.max(1, ACTIVITY_ENUM.indexOf(v) + 1);
const sliderToEnum  = (n) => ACTIVITY_ENUM[Math.max(0, n - 1)] || 'moderado';

const PRESUPUESTOS_EMOJIS = ['🎒', '✈', '💎'];

function toggleItem(arr, item) {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function SectionLabel({ children }) {
  return (
    <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, mt: 2 }}>
      {children}
    </Typography>
  );
}

function ChipGroup({ options, selected, onToggle }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {options.map(([id, label]) => {
        const isSelected = Array.isArray(selected) ? selected.includes(id) : selected === id;
        return (
          <Chip key={id} label={label} variant="outlined"
            onClick={() => onToggle(id)} color={isSelected ? 'primary' : 'default'}
            sx={{ cursor: 'pointer', fontSize: '0.78rem' }} />
        );
      })}
    </Box>
  );
}

// ── Step 1 ────────────────────────────────────────────────────
function StepFechas({ data, setData, t }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Typography variant="h5" sx={{ mb: 0.5, color: 'var(--bj-text)' }}>{t('newTrip.step1.title')}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)', mb: 2.5 }}>{t('newTrip.step1.subtitle')}</Typography>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
        <DatePicker label={t('newTrip.step1.startDate')} value={data.fechaInicio}
          onChange={(v) => setData((d) => ({ ...d, fechaInicio: v, fechaFin: null }))}
          disablePast slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
        <DatePicker label={t('newTrip.step1.endDate')} value={data.fechaFin}
          onChange={(v) => setData((d) => ({ ...d, fechaFin: v }))}
          minDate={data.fechaInicio ? data.fechaInicio.add(3, 'day') : dayjs().add(3, 'day')}
          maxDate={data.fechaInicio ? data.fechaInicio.add(30, 'day') : undefined}
          disabled={!data.fechaInicio}
          slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
      </Box>

      <Typography sx={{ fontSize: '0.78rem', color: 'var(--bj-text-muted)', mb: 1 }}>
        {t('newTrip.step1.travelersLabel')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => setData((d) => ({ ...d, numViajeros: Math.max(1, d.numViajeros - 1) }))}
          sx={{ border: '1px solid #e05c5c', color: '#e05c5c', width: 36, height: 36 }}>
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--bj-text)', minWidth: 24, textAlign: 'center' }}>
          {data.numViajeros}
        </Typography>
        <IconButton onClick={() => setData((d) => ({ ...d, numViajeros: Math.min(10, d.numViajeros + 1) }))}
          sx={{ border: '1px solid var(--bj-success)', color: 'var(--bj-success)', width: 36, height: 36 }}>
          <AddIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontSize: '0.78rem', color: 'var(--bj-text-muted)' }}>
          {data.numViajeros === 1 ? t('newTrip.step1.person') : t('newTrip.step1.people')}
        </Typography>
      </Box>
    </LocalizationProvider>
  );
}

// ── Step 2 ────────────────────────────────────────────────────
function StepPresupuesto({ data, setData, t }) {
  const budgets = t('newTrip.step2.budgets', { returnObjects: true });
  const maxValues = [600, 1200, 2500];

  return (
    <>
      <Typography variant="h5" sx={{ mb: 0.5, color: 'var(--bj-text)' }}>{t('newTrip.step2.title')}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)', mb: 2.5 }}>{t('newTrip.step2.subtitle')}</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
        {budgets.map((p, i) => {
          const selected = data.presupuestoTipo === ['economico', 'estandar', 'premium'][i];
          return (
            <Card key={p.name}
              onClick={() => setData((d) => ({ ...d, presupuestoTipo: ['economico', 'estandar', 'premium'][i], presupuesto: maxValues[i] }))}
              sx={{ cursor: 'pointer', border: selected ? '1px solid #f0a500' : '1px solid var(--bj-border)',
                bgcolor: selected ? 'rgba(240,165,0,0.08)' : 'var(--bj-surface2)', transition: 'all 0.15s', p: 0 }}>
              <CardContent sx={{ py: 1.5, px: 1, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.5rem', lineHeight: 1.2 }}>{PRESUPUESTOS_EMOJIS[i]}</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: selected ? '#f0a500' : 'var(--bj-text)', mt: 0.5 }}>
                  {p.name}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'var(--bj-text-muted)', mt: 0.25 }}>{p.range}</Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2 }}>
        <Box sx={{ flex: 1, height: 1, bgcolor: 'var(--bj-border)' }} />
        <Typography sx={{ fontSize: '0.75rem', color: 'var(--bj-text-muted)' }}>{t('newTrip.step2.customize')}</Typography>
        <Box sx={{ flex: 1, height: 1, bgcolor: 'var(--bj-border)' }} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField label={t('newTrip.step2.min')} type="number" size="small" fullWidth value={data.presupuestoMin}
          onChange={(e) => setData((d) => ({ ...d, presupuestoMin: Number(e.target.value), presupuestoTipo: 'personalizado' }))} />
        <TextField label={t('newTrip.step2.max')} type="number" size="small" fullWidth value={data.presupuesto}
          onChange={(e) => setData((d) => ({ ...d, presupuesto: Number(e.target.value), presupuestoTipo: 'personalizado' }))} />
      </Box>

      <Card sx={{ mt: 2, p: 1.5 }}>
        <Typography sx={{ fontSize: '0.7rem', color: 'var(--bj-text-muted)', mb: 0.75 }}>{t('newTrip.step2.includes')}</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {[t('newTrip.step2.flight'), t('newTrip.step2.accommodation'), t('newTrip.step2.transfers')].map((item) => (
            <Typography key={item} sx={{ fontSize: '0.78rem', color: 'var(--bj-text)' }}>{item}</Typography>
          ))}
        </Box>
      </Card>
    </>
  );
}

// ── Step 3 ────────────────────────────────────────────────────
function StepPreferencias({ data, setData, t, perfilLoading }) {
  const intereses    = Object.entries(t('interests',    { returnObjects: true }));
  const alojamientos = Object.entries(t('accommodations', { returnObjects: true }));
  const dieta        = Object.entries(t('dietary',      { returnObjects: true }));
  const niveles      = Object.entries(t('activityLevels', { returnObjects: true }));

  const sliderMarks = ACTIVITY_ENUM.map((key, i) => ({
    value: i + 1,
    label: t(`activityLevels.${key}`),
  }));

  return (
    <>
      <Typography variant="h5" sx={{ mb: 0.5, color: 'var(--bj-text)' }}>{t('newTrip.step3.title')}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)', mb: 2 }}>{t('newTrip.step3.subtitle')}</Typography>
      {perfilLoading && <CircularProgress size={18} sx={{ color: '#f0a500', mb: 1 }} />}

      <SectionLabel>{t('newTrip.step3.interests')}</SectionLabel>
      <ChipGroup options={intereses} selected={data.intereses}
        onToggle={(id) => setData((d) => ({ ...d, intereses: toggleItem(d.intereses, id) }))} />

      <SectionLabel>{t('newTrip.step3.accommodation')}</SectionLabel>
      <ChipGroup options={alojamientos} selected={[data.tipoAlojamiento]}
        onToggle={(id) => setData((d) => ({ ...d, tipoAlojamiento: id }))} />

      <SectionLabel>{t('newTrip.step3.dietary')}</SectionLabel>
      <ChipGroup options={dieta} selected={data.restriccionesAlimentarias}
        onToggle={(id) => setData((d) => ({ ...d, restriccionesAlimentarias: toggleItem(d.restriccionesAlimentarias, id) }))} />

      <SectionLabel>{t('newTrip.step3.activityLevel')}</SectionLabel>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        px: 0,
      }}>
        <Box sx={{
          width: { xs: '90%', sm: '100%' },
          '& .MuiSlider-markLabel': {
            fontSize: { xs: '0.55rem', sm: '0.75rem' },
            whiteSpace: 'nowrap',
            top: { xs: 'auto', sm: 22 },
            bottom: { xs: -18, sm: 'auto' },
            lineHeight: 1,
          },
          '& .MuiSlider-rail, & .MuiSlider-track': {
            height: 6,
          },
        }}>
          <Slider value={data.nivelActividadSlider} min={1} max={4} step={1}
            marks={sliderMarks}
            onChange={(_, v) => setData((d) => ({ ...d, nivelActividadSlider: v }))} />
        </Box>
      </Box>
    </>
  );
}

// ── Step 4 ────────────────────────────────────────────────────
function StepDestinos({ candidatos, setCandidatos, viajeId, t }) {
  const [toastOpen, setToastOpen] = useState(false);
  const MAX_VETOS = 2;

  const handleVetar = async (candidato) => {
    const vetados = candidatos.filter((c) => c.vetado);
    const esVetado = candidato.vetado;

    // Si es para des-vetar, permitir siempre
    if (esVetado) {
      try {
        await vetarCandidato(viajeId, candidato.id);
        setCandidatos((cs) => cs.map((c) => c.id === candidato.id ? { ...c, vetado: false } : c));
      } catch {}
      return;
    }

    // Si es para vetar, verificar límite
    if (vetados.length >= MAX_VETOS) {
      setToastOpen(true);
      return;
    }

    try {
      await vetarCandidato(viajeId, candidato.id);
      setCandidatos((cs) => {
        const actualizado = cs.map((c) => c.id === candidato.id ? { ...c, vetado: true } : c);
        const nuevosVetados = actualizado.filter((c) => c.vetado);
        if (nuevosVetados.length === MAX_VETOS) {
          setToastOpen(true);
        }
        return actualizado;
      });
    } catch {}
  };

  const vetados = candidatos.filter((c) => c.vetado);
  const maxVetosAlcanzado = vetados.length >= MAX_VETOS;

  return (
    <>
      <Typography variant="h5" sx={{ mb: 0.5, color: 'var(--bj-text)' }}>{t('newTrip.step4.title')}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)', mb: 2 }}>{t('newTrip.step4.subtitle')}</Typography>

      {candidatos.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>{t('newTrip.step4.noDestinations')}</Alert>
      )}

      {candidatos.map((c) => (
        <Card key={c.id} sx={{
          mb: 1.5,
          opacity: c.vetado ? 0.5 : 1,
          bgcolor: c.vetado ? 'rgba(224,92,92,0.05)' : 'transparent',
          border: c.vetado ? '1px solid rgba(224,92,92,0.3)' : undefined,
        }}>
          <CardContent sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--bj-text)',
                  textDecoration: c.vetado ? 'line-through' : 'none' }}>
                  {c.ciudad}, {c.pais}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: 'var(--bj-text-muted)' }}>{c.tipo_viaje}</Typography>
                  {c.precio_estimado && (
                    <Chip label={`~${c.precio_estimado}€/pers`} size="small"
                      sx={{ bgcolor: 'rgba(240,165,0,0.15)', color: '#f0a500', fontSize: '0.62rem', height: 18 }} />
                  )}
                </Box>
                {c.descripcion && (
                  <Typography sx={{ fontSize: '0.68rem', color: 'var(--bj-text-muted)', mt: 0.5 }}>{c.descripcion}</Typography>
                )}
              </Box>
              <Button variant="outlined" size="small" onClick={() => handleVetar(c)}
                disabled={!c.vetado && maxVetosAlcanzado}
                startIcon={<BlockIcon sx={{ fontSize: 14 }} />}
                sx={{
                  borderColor: c.vetado ? '#999' : '#e05c5c',
                  color: c.vetado ? '#999' : '#e05c5c',
                  fontSize: '0.65rem',
                  ml: 1,
                  py: 0.5,
                  px: 1,
                  minWidth: 'unset',
                  '&:hover': {
                    borderColor: c.vetado ? '#999' : '#e05c5c',
                    bgcolor: c.vetado ? 'rgba(153,153,153,0.1)' : 'rgba(224,92,92,0.1)'
                  },
                  '&:disabled': { borderColor: '#ccc', color: '#ccc' }
                }}>
                {c.vetado ? 'Restaurar' : t('newTrip.step4.ban')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}

      {vetados.length > 0 && (
        <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)', textAlign: 'center', mt: 2, mb: 1 }}>
          {vetados.length} destino{vetados.length !== 1 ? 's' : ''} vetado{vetados.length !== 1 ? 's' : ''}
        </Typography>
      )}

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        message="Máximo 2 destinos pueden ser vetados"
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: '#e05c5c',
            color: '#fff',
            fontSize: '0.85rem',
          }
        }}
      />
    </>
  );
}

// ── Step 5 ────────────────────────────────────────────────────
function StepConfirmar({ data, reservaData, onConfirmar, loading, t }) {
  const dias = data.fechaInicio && data.fechaFin ? data.fechaFin.diff(data.fechaInicio, 'day') : 0;

  return (
    <>
      <Typography variant="h5" sx={{ mb: 0.5, color: 'var(--bj-text)' }}>{t('newTrip.step5.title')}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)', mb: 2.5 }}>{t('newTrip.step5.subtitle')}</Typography>

      {reservaData ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ {t('newTrip.step5.reservationCreated', { id: reservaData.id })}
        </Alert>
      ) : (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            {[
              [t('newTrip.step5.dates'),    `${data.fechaInicio?.format('DD MMM YYYY')} → ${data.fechaFin?.format('DD MMM YYYY')}`],
              [t('newTrip.step5.duration'), t('newTrip.step5.nights_other', { count: dias })],
              [t('newTrip.step5.travelers'),t('newTrip.step5.person_other', { count: data.numViajeros })],
              [t('newTrip.step5.budget'),   t('newTrip.step5.budgetValue', { amount: data.presupuesto })],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid var(--bj-border)' }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)' }}>{label}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text)', fontWeight: 500 }}>{value}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {!reservaData && (
        <>
          <Card sx={{ mb: 2, border: '1px solid rgba(240,165,0,0.3)' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography sx={{ fontSize: '0.72rem', color: '#f0a500', fontWeight: 600, mb: 0.5 }}>
                🔒 {t('newTrip.step5.hiddenAlert')}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>
                {t('newTrip.step5.hiddenDesc')}
              </Typography>
            </CardContent>
          </Card>
          <Button variant="contained" fullWidth onClick={onConfirmar} disabled={loading} sx={{ mt: 1 }}>
            {loading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : t('newTrip.step5.confirm')}
          </Button>
        </>
      )}
    </>
  );
}

// ── Step 6 (Pago simulado) ───────────────────────────────────
function StepPago({ viaje, onPagar, t }) {
  const navigate = useNavigate();
  const [payState, setPayState] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [error, setError] = useState('');

  const numViajeros = viaje?.num_viajeros || 1;
  const total = viaje?.presupuesto ? Number(viaje.presupuesto) * numViajeros : 0;
  const importe = total
    ? total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
    : '—';

  const handlePagar = async () => {
    setPayState('processing');
    setError('');
    try {
      await onPagar();
      setPayState('success');
      setTimeout(() => navigate('/viajes'), 2000);
    } catch (e) {
      setPayState('idle');
      setError(e.response?.data?.error || e.message || 'Error al procesar el pago');
    }
  };

  if (payState === 'success') {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography sx={{ fontSize: '3rem', mb: 1 }}>✅</Typography>
        <Typography variant="h5" sx={{ color: 'var(--bj-success)', fontWeight: 700 }}>
          {t('newTrip.step6.successTitle')}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: 'var(--bj-text-muted)', mt: 1 }}>
          {t('newTrip.step6.successDesc')}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h5" sx={{ mb: 0.5, color: 'var(--bj-text)' }}>
        {t('newTrip.step6.title')}
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)', mb: 2.5 }}>
        {t('newTrip.step6.subtitle')}
      </Typography>

      <Card sx={{ mb: 2.5, border: '1px solid rgba(240,165,0,0.4)', bgcolor: 'rgba(240,165,0,0.06)' }}>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)', mb: 0.5 }}>
            {t('newTrip.step6.totalLabel')}
          </Typography>
          <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#f0a500', lineHeight: 1.1 }}>
            {importe}
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: 'var(--bj-text-muted)', mt: 0.5 }}>
            {Number(viaje?.presupuesto).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} × {numViajeros} {numViajeros === 1 ? t('newTrip.step1.person') : t('newTrip.step1.people')} · {t('newTrip.step6.allInclusive')}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)', fontWeight: 600 }}>
              {t('newTrip.step6.cardDetails')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <Box sx={{ border: '1px solid var(--bj-border)', borderRadius: 1, px: 0.75, py: 0.25,
                fontSize: '0.6rem', fontWeight: 700, color: '#1a1f71', bgcolor: '#fff' }}>VISA</Box>
              <Box sx={{ border: '1px solid var(--bj-border)', borderRadius: 1, px: 0.75, py: 0.25,
                fontSize: '0.6rem', fontWeight: 700, color: '#eb001b', bgcolor: '#fff' }}>MC</Box>
            </Box>
          </Box>
          <TextField label={t('newTrip.step6.cardNumber')} defaultValue="4242 4242 4242 4242"
            size="small" fullWidth inputProps={{ maxLength: 19 }} sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <TextField label={t('newTrip.step6.expiry')} defaultValue="12/29"
              size="small" fullWidth inputProps={{ maxLength: 5 }} />
            <TextField label={t('newTrip.step6.cvv')} defaultValue="123"
              size="small" fullWidth inputProps={{ maxLength: 3 }} type="password" />
          </Box>
          <TextField label={t('newTrip.step6.cardHolder')} defaultValue=""
            size="small" fullWidth placeholder={t('newTrip.step6.cardHolderPlaceholder')} />
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: '0.68rem', color: 'var(--bj-text-muted)' }}>
          🔒 {t('newTrip.step6.secureNote')}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button variant="contained" fullWidth onClick={handlePagar}
        disabled={payState === 'processing'} sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700 }}>
        {payState === 'processing'
          ? <><CircularProgress size={18} sx={{ color: '#000', mr: 1 }} />{t('newTrip.step6.processing')}</>
          : `${t('newTrip.step6.payBtn')} ${importe}`}
      </Button>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function NuevoViajePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem('bj_wizard_step');
    return saved ? Number(saved) : 0;
  });
  const [loading, setLoading] = useState(false);
  const [perfilLoading, setPerfilLoading] = useState(false);
  const [error, setError] = useState('');
  const [viaje, setViaje] = useState(() => {
    const saved = sessionStorage.getItem('bj_wizard_viaje');
    return saved ? JSON.parse(saved) : null;
  });
  const [candidatos, setCandidatos] = useState(() => {
    const saved = sessionStorage.getItem('bj_wizard_candidatos');
    return saved ? JSON.parse(saved) : [];
  });
  const [reservaData, setReservaData] = useState(null);

  const [form, setForm] = useState(() => {
    const saved = sessionStorage.getItem('bj_wizard_form');
    return saved ? JSON.parse(saved) : {
      fechaInicio: null,
      fechaFin: null,
      numViajeros: 2,
      presupuestoTipo: 'estandar',
      presupuesto: 1200,
      presupuestoMin: 600,
      intereses: [],
      tipoAlojamiento: 'hotel',
      restriccionesAlimentarias: [],
      nivelActividadSlider: 2, // 2 = 'moderado'
    };
  });

  // Persist wizard state in sessionStorage for browser back/forward
  useEffect(() => {
    const formToSave = { ...form, fechaInicio: null, fechaFin: null };
    sessionStorage.setItem('bj_wizard_form', JSON.stringify(formToSave));
    sessionStorage.setItem('bj_wizard_step', String(step));
    if (viaje) sessionStorage.setItem('bj_wizard_viaje', JSON.stringify(viaje));
    if (candidatos.length) sessionStorage.setItem('bj_wizard_candidatos', JSON.stringify(candidatos));
  }, [form, step, viaje, candidatos]);

  // Cleanup sessionStorage when leaving the page
  useEffect(() => {
    return () => {
      ['bj_wizard_step', 'bj_wizard_form', 'bj_wizard_viaje', 'bj_wizard_candidatos']
        .forEach((k) => sessionStorage.removeItem(k));
    };
  }, []);

  // Load profile preferences when entering step 2
  useEffect(() => {
    if (step === 2) {
      setPerfilLoading(true);
      getPerfil()
        .then((data) => {
          const p = data.perfil || data;
          setForm((f) => ({
            ...f,
            intereses: Array.isArray(p.intereses) ? p.intereses : f.intereses,
            tipoAlojamiento: p.tipo_alojamiento || f.tipoAlojamiento,
            restriccionesAlimentarias: Array.isArray(p.restricciones_alimentarias)
              ? p.restricciones_alimentarias : f.restriccionesAlimentarias,
            nivelActividadSlider: enumToSlider(p.nivel_actividad) || f.nivelActividadSlider,
          }));
        })
        .catch(() => {})
        .finally(() => setPerfilLoading(false));
    }
  }, [step]);

  const validateStep = () => {
    if (step === 0) {
      if (!form.fechaInicio || !form.fechaFin) return t('newTrip.errors.selectDates');
      const dias = form.fechaFin.diff(form.fechaInicio, 'day');
      if (dias < 3)  return t('newTrip.errors.minDays');
      if (dias > 30) return t('newTrip.errors.maxDays');
    }
    if (step === 1 && (!form.presupuesto || form.presupuesto < 100)) {
      return t('newTrip.errors.invalidBudget');
    }
    return '';
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');

    if (step === 2) {
      // Si ya existe un viaje, solo avanzar sin crear uno nuevo
      if (viaje && candidatos.length > 0) {
        setStep(3);
        return;
      }

      setLoading(true);
      try {
        // Save preferences (correctly maps slider → ENUM)
        await actualizarPerfil({
          intereses: form.intereses,
          tipo_alojamiento: form.tipoAlojamiento,
          restricciones_alimentarias: form.restriccionesAlimentarias,
          nivel_actividad: sliderToEnum(form.nivelActividadSlider),
        });

        const duracion = form.fechaFin.diff(form.fechaInicio, 'day');
        const idioma = localStorage.getItem('bj_lang') || 'es';
        const nuevoViaje = await crearViaje({
          fecha_inicio:  form.fechaInicio.format('YYYY-MM-DD'),
          fecha_fin:     form.fechaFin.format('YYYY-MM-DD'),
          duracion,
          presupuesto:   form.presupuesto,
          num_viajeros:  form.numViajeros,
          idioma,
        });

        const viajeObj = nuevoViaje.viaje || nuevoViaje;
        const candidatosArray = viajeObj.candidatos || nuevoViaje.candidatos || [];

        setViaje(viajeObj);
        setCandidatos(candidatosArray);
        setStep(3);
      } catch (e) {
        setError(e.response?.data?.mensaje || 'Error al crear el viaje');
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep((s) => s + 1);
  };

  const handleConfirmar = async () => {
    if (!viaje) return;
    setLoading(true);
    setError('');
    try {
      const data = await crearReserva({ viaje_id: viaje.id });
      setReservaData(data.reserva || data);
      setStep(5);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async () => {
    if (!reservaData?.id) throw new Error('Reserva no válida');
    await simularPago(reservaData.id);
    ['bj_wizard_step', 'bj_wizard_form', 'bj_wizard_viaje', 'bj_wizard_candidatos']
      .forEach((k) => sessionStorage.removeItem(k));
    navigate('/viajes');
    // Reset estado después de navegar
    setTimeout(() => {
      setStep(0);
      setViaje(null);
      setCandidatos([]);
      setReservaData(null);
      setForm({
        fechaInicio: null,
        fechaFin: null,
        numViajeros: 2,
        presupuestoTipo: 'estandar',
        presupuesto: 1200,
        presupuestoMin: 600,
        intereses: [],
        tipoAlojamiento: 'hotel',
        restriccionesAlimentarias: [],
        nivelActividadSlider: 2,
      });
    }, 100);
  };

  const pasos = t('newTrip.steps', { returnObjects: true });

  return (
    <Box sx={{ px: 2, pt: 2, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <IconButton onClick={() => {
          if (step === 5) return;
          if (step > 0) {
            setStep(step - 1);
          } else {
            // Cleanup sessionStorage before leaving
            ['bj_wizard_step', 'bj_wizard_form', 'bj_wizard_viaje', 'bj_wizard_candidatos']
              .forEach((k) => sessionStorage.removeItem(k));
            navigate(-1);
          }
        }}
          size="small" sx={{ color: '#f0a500' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: 'var(--bj-text)' }}>
          {t('newTrip.title')}
        </Typography>
      </Box>

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
        {pasos.map((label, i) => (
          <Step key={label} completed={i < step}>
            <StepLabel
              StepIconProps={{
                sx: {
                  color: i < step ? 'var(--bj-success) !important' : i === step ? '#f0a500 !important' : 'var(--bj-border) !important',
                  '&.Mui-completed': { color: 'var(--bj-success) !important' },
                  '&.Mui-active':    { color: '#f0a500 !important' },
                },
              }}
            >
              <Typography sx={{ fontSize: '0.62rem', color: i === step ? '#f0a500' : 'var(--bj-text-muted)' }}>
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {step === 0 && <StepFechas   data={form} setData={setForm} t={t} />}
      {step === 1 && <StepPresupuesto data={form} setData={setForm} t={t} />}
      {step === 2 && <StepPreferencias data={form} setData={setForm} t={t} perfilLoading={perfilLoading} />}
      {step === 3 && <StepDestinos candidatos={candidatos} setCandidatos={setCandidatos} viajeId={viaje?.id} t={t} />}
      {step === 4 && <StepConfirmar data={form} reservaData={reservaData} onConfirmar={handleConfirmar} loading={loading} t={t} />}
      {step === 5 && <StepPago viaje={viaje} onPagar={handlePagar} t={t} />}

      {step < 4 && (
        <Button variant="contained" fullWidth endIcon={loading ? null : <ArrowForwardIcon />}
          onClick={handleNext} disabled={loading} sx={{ mt: 3 }}>
          {loading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : step === 2 ? t('newTrip.step3.generateBtn') : t('newTrip.next')}
        </Button>
      )}
    </Box>
  );
}
