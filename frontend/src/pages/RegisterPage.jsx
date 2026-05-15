// ============================================================
// BlindJourney – Página de Registro
// Autora: Alicia Maillo
//
// Formulario de creación de cuenta con validación de contraseña.
// Componentes clave:
// - PasswordStrength: validador visual (3 criterios: 8+ chars, mayúscula, número)
// - Validación: antes de enviar, verifica que cumple los 3 criterios
// - Toggle de visibilidad: botón ojo para mostrar/ocultar contraseña
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import { registroApi } from '../api/auth';

function PasswordStrength({ password, labels }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password)];
  const strength = checks.filter(Boolean).length;
  const colors = ['#e05c5c', '#f0a500', '#3ddc84'];
  if (!password) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 2,
          bgcolor: i < strength ? colors[strength - 1] : 'var(--bj-border)', transition: 'background-color 0.3s' }} />
      ))}
      <Typography sx={{ fontSize: '0.65rem', color: colors[strength - 1] || 'var(--bj-text-muted)', ml: 0.5 }}>
        {strength > 0 ? labels[strength - 1] : ''}
      </Typography>
    </Box>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ nombre: '', apellidos: '', email: '', password: '', telefono: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError(t('register.passwordError'));
      return;
    }
    setLoading(true);
    try {
      const body = { nombre: form.nombre, apellidos: form.apellidos, email: form.email, password: form.password };
      if (form.telefono) body.telefono = form.telefono;
      await registroApi(body);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.mensaje || t('common.error', 'Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', px: 3, py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate('/login')} size="small" sx={{ color: '#f0a500' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.4rem', color: 'var(--bj-text)' }}>
            {t('register.title')}
          </Typography>
        </Box>

        {success ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>{t('register.success')}</Alert>
            <Button variant="contained" fullWidth onClick={() => navigate('/login')}>
              {t('register.goToLogin')}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>{error}</Alert>}

            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <TextField label={t('register.firstName')} fullWidth required value={form.nombre} onChange={set('nombre')} />
              <TextField label={t('register.lastName')}  fullWidth required value={form.apellidos} onChange={set('apellidos')} />
            </Box>

            <TextField label={t('register.email')} type="email" fullWidth required
              value={form.email} onChange={set('email')} sx={{ mb: 2 }} autoComplete="email" />

            <TextField
              label={t('register.password')} type={showPwd ? 'text' : 'password'} fullWidth required
              value={form.password} onChange={set('password')} autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" size="small">
                      {showPwd
                        ? <VisibilityOffIcon sx={{ color: 'var(--bj-text-muted)', fontSize: 18 }} />
                        : <VisibilityIcon   sx={{ color: 'var(--bj-text-muted)', fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <PasswordStrength password={form.password}
              labels={[t('register.strength.weak'), t('register.strength.medium'), t('register.strength.strong')]} />
            <Typography sx={{ fontSize: '0.7rem', color: 'var(--bj-text-muted)', mt: 0.75, mb: 2 }}>
              {t('register.passwordHint')}
            </Typography>

            <TextField label={t('register.phone')} type="tel" fullWidth
              value={form.telefono} onChange={set('telefono')} sx={{ mb: 2.5 }} placeholder="+34 600 000 000" />

            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 1.5 }}>
              {loading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : t('register.submit')}
            </Button>

            <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>
              {t('register.emailVerification')}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
