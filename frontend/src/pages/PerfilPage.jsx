// ============================================================
// BlindJourney – Página de Perfil del Usuario
// Autora: Alicia Maillo
//
// Permite editar las preferencias personales del usuario:
// - Ciudad de origen
// - Intereses (cultura, gastronomía, naturaleza, etc.)
// - Tipo de alojamiento (hotel, Airbnb, campamento)
// - Restricciones dietéticas
// - Nivel de actividad (slider de 1-4: tranquilo a aventurero)
// - Botón de logout (rojo, en la parte inferior)
//
// Concepto: mismo mapeo ENUM que NuevoViajePage para nivel de actividad.
// Guarda cambios via actualizarPerfil() del contexto.
// ============================================================

import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Chip, Slider,
  CircularProgress, Alert, Avatar, Divider, Card, CardContent,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import { getPerfil, actualizarPerfil } from '../api/perfil';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ACTIVITY_ENUM = ['tranquilo', 'moderado', 'activo', 'aventurero'];
const enumToSlider = (v) => Math.max(1, ACTIVITY_ENUM.indexOf(v) + 1);
const sliderToEnum = (n) => ACTIVITY_ENUM[Math.max(0, n - 1)] || 'moderado';

function SectionLabel({ children }) {
  return (
    <Typography sx={{
      fontSize: '0.7rem', color: 'var(--bj-text-muted)', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, mt: 2,
    }}>
      {children}
    </Typography>
  );
}

function ChipGroup({ options, selected, onToggle, single = false }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {options.map((opt) => {
        const isSelected = single ? selected === opt.id : (selected || []).includes(opt.id);
        return (
          <Chip key={opt.id} label={opt.label} variant="outlined" onClick={() => onToggle(opt.id)}
            color={isSelected ? 'primary' : 'default'}
            sx={{ cursor: 'pointer', fontSize: '0.78rem' }}
          />
        );
      })}
    </Box>
  );
}

export default function PerfilPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const INTERESES = [
    { id: 'cultura',       label: t('interests.cultura') },
    { id: 'playa',         label: t('interests.playa') },
    { id: 'gastronomia',   label: t('interests.gastronomia') },
    { id: 'montana',       label: t('interests.montana') },
    { id: 'ocio_nocturno', label: t('interests.ocio_nocturno') },
    { id: 'naturaleza',    label: t('interests.naturaleza') },
    { id: 'compras',       label: t('interests.compras') },
    { id: 'aventura',      label: t('interests.aventura') },
  ];

  const ALOJAMIENTOS = [
    { id: 'hotel',       label: t('accommodations.hotel') },
    { id: 'apartamento', label: t('accommodations.apartamento') },
    { id: 'hostal',      label: t('accommodations.hostal') },
  ];

  const DIETA = [
    { id: 'vegetariano', label: t('dietary.vegetariano') },
    { id: 'vegano',      label: t('dietary.vegano') },
    { id: 'sin_gluten',  label: t('dietary.sin_gluten') },
  ];

  const ACTIVITY_MARKS = [
    { value: 1, label: t('activityLevels.tranquilo') },
    { value: 2, label: t('activityLevels.moderado') },
    { value: 3, label: t('activityLevels.activo') },
    { value: 4, label: t('activityLevels.aventurero') },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [prefs, setPrefs] = useState({
    intereses: [],
    tipo_alojamiento: 'hotel',
    restricciones_alimentarias: [],
    nivelActividadSlider: 2,
    ciudad_origen: '',
    moneda: 'EUR',
  });

  useEffect(() => {
    getPerfil()
      .then((data) => {
        const p = data.perfil || data;
        setPrefs({
          intereses: Array.isArray(p.intereses) ? p.intereses : [],
          tipo_alojamiento: p.tipo_alojamiento || 'hotel',
          restricciones_alimentarias: Array.isArray(p.restricciones_alimentarias)
            ? p.restricciones_alimentarias : [],
          nivelActividadSlider: enumToSlider(p.nivel_actividad),
          ciudad_origen: p.ciudad_origen || '',
          moneda: p.moneda || 'EUR',
        });
      })
      .catch(() => setError(t('common.error', 'Error')))
      .finally(() => setLoading(false));
  }, [t]);

  const toggleInterest = (id) => setPrefs((p) => ({
    ...p,
    intereses: p.intereses.includes(id) ? p.intereses.filter((x) => x !== id) : [...p.intereses, id],
  }));

  const toggleDieta = (id) => setPrefs((p) => ({
    ...p,
    restricciones_alimentarias: p.restricciones_alimentarias.includes(id)
      ? p.restricciones_alimentarias.filter((x) => x !== id)
      : [...p.restricciones_alimentarias, id],
  }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        intereses: prefs.intereses,
        tipo_alojamiento: prefs.tipo_alojamiento,
        restricciones_alimentarias: prefs.restricciones_alimentarias,
        nivel_actividad: sliderToEnum(prefs.nivelActividadSlider),
        ciudad_origen: prefs.ciudad_origen,
        moneda: prefs.moneda,
      };
      await actualizarPerfil(payload);
      setSuccess(t('profile.saveSuccess'));
    } catch (e) {
      setError(e.response?.data?.mensaje || t('common.error', 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const nombre = user?.nombre || '';
  const apellidos = user?.apellidos || '';
  const initials = (nombre.charAt(0) + (apellidos.charAt(0) || '')).toUpperCase();

  return (
    <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', color: 'var(--bj-text)', mb: 2 }}>
        {t('profile.title')}
      </Typography>

      <Card sx={{ mb: 2, bgcolor: 'var(--bj-surface)', border: '1px solid var(--bj-border)' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: '#f0a500', color: '#000', fontSize: '1.1rem', fontWeight: 700 }}>
              {initials}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--bj-text)' }}>
                {nombre} {apellidos}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'var(--bj-text-muted)' }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 1.5 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress sx={{ color: '#f0a500' }} />
        </Box>
      ) : (
        <>
          <SectionLabel>{t('profile.originCity')}</SectionLabel>
          <TextField
            placeholder="ej. Madrid"
            value={prefs.ciudad_origen}
            onChange={(e) => setPrefs((p) => ({ ...p, ciudad_origen: e.target.value }))}
            fullWidth size="small" sx={{ mb: 0.5 }}
          />

          <SectionLabel>{t('profile.interests')}</SectionLabel>
          <ChipGroup options={INTERESES} selected={prefs.intereses} onToggle={toggleInterest} />

          <SectionLabel>{t('profile.accommodation')}</SectionLabel>
          <ChipGroup
            options={ALOJAMIENTOS} selected={prefs.tipo_alojamiento} single
            onToggle={(id) => setPrefs((p) => ({ ...p, tipo_alojamiento: id }))}
          />

          <SectionLabel>{t('profile.dietary')}</SectionLabel>
          <ChipGroup options={DIETA} selected={prefs.restricciones_alimentarias} onToggle={toggleDieta} />

          <SectionLabel>{t('profile.activityLevel')}</SectionLabel>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            px: 0,
            pb: 1,
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
              <Slider
                value={prefs.nivelActividadSlider}
                min={1} max={4} step={1}
                marks={ACTIVITY_MARKS}
                onChange={(_, v) => setPrefs((p) => ({ ...p, nivelActividadSlider: v }))}
                sx={{ color: '#f0a500' }}
              />
            </Box>
          </Box>

          <Button
            variant="contained" fullWidth
            startIcon={saving ? <CircularProgress size={16} sx={{ color: '#000' }} /> : <SaveIcon />}
            onClick={handleSave} disabled={saving} sx={{ mt: 2 }}
          >
            {t('profile.save')}
          </Button>

          <Divider sx={{ my: 2.5 }} />

          <Button
            variant="outlined" fullWidth startIcon={<LogoutIcon />} onClick={handleLogout}
            sx={{ borderColor: 'var(--bj-error)', color: 'var(--bj-error)', '&:hover': { borderColor: 'var(--bj-error)', bgcolor: 'rgba(224,92,92,0.08)' } }}
          >
            {t('profile.logout')}
          </Button>
        </>
      )}
    </Box>
  );
}
