// ============================================================
// BlindJourney – Página de Login
// Autora: Alicia Maillo
//
// Página pública para autenticación de usuarios.
// Flujo: usuario entra email + contraseña → login() → dashboard
//
// Características:
// - Toggle de visibilidad de contraseña
// - Manejo de errores del backend
// - Link a "Olvidé mi contraseña" y a "Crear cuenta"
// ============================================================

// useState: gestiona estado local del formulario y UI
import { useState } from 'react';
// useNavigate: para redirigir post-login
// Link: para enlaces a otras rutas
import { useNavigate, Link } from 'react-router-dom';
// MUI components para UI
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
// Iconos para toggle visibilidad de contraseña
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
// Traducciones
import { useTranslation } from 'react-i18next';
// Hook de autenticación
import { useAuth } from '../context/AuthContext';
// Componente de cabecera con logo
import LogoHeader from '../components/LogoHeader';

// ── COMPONENTE PÁGINA DE LOGIN ────────────────────────────
/**
 * Página pública que permite al usuario autenticarse.
 * Props: ninguna
 *
 * Flujo:
 * 1. Usuario completa email y contraseña
 * 2. Al hacer submit, llama a useAuth().login()
 * 3. Si es exitoso, redirige a /dashboard
 * 4. Si falla, muestra error del backend
 */
export default function LoginPage() {
  // Para navegar post-login
  const navigate = useNavigate();
  // Acceso a la función login del contexto
  const { login } = useAuth();
  // Acceso a traducciones
  const { t } = useTranslation();

  // ── ESTADO DEL FORMULARIO ───────────────────────────────
  // form: contiene email y password
  const [form, setForm] = useState({ email: '', password: '' });
  // showPwd: controla si la contraseña se muestra como texto o puntos
  const [showPwd, setShowPwd] = useState(false);
  // loading: true mientras se procesa el login (desactiva el botón)
  const [loading, setLoading] = useState(false);
  // error: mensaje de error del servidor o de validación
  const [error, setError] = useState('');

  // ── MANEJADOR DE SUBMIT ─────────────────────────────────
  /**
   * Se ejecuta cuando el usuario hace clic en "Iniciar sesión".
   * Pasos:
   * 1. Previene el comportamiento por defecto del form (recarga)
   * 2. Limpia errores previos
   * 3. Llama a login() desde AuthContext
   * 4. Si es exitoso, redirige a /dashboard
   * 5. Si falla, muestra el error del servidor
   * 6. Siempre desactiva loading al final (try/catch/finally)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();  // Previene recarga de página
    setError('');
    setLoading(true);

    try {
      // Llama a login() que llama a loginApi() y actualiza AuthContext
      await login(form.email, form.password);
      // Si todo va bien, redirige al dashboard
      navigate('/dashboard');
    } catch (err) {
      // Si el login falla, extrae el mensaje de error del servidor
      // Fallback a traducción genérica si no hay respuesta
      setError(err.response?.data?.mensaje || t('login.error'));
    } finally {
      // Desactiva loading en cualquier caso
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 420, mx: 'auto', px: 3, py: 2 }}
      >
        <LogoHeader tagline={t('login.tagline')} />

        {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>{error}</Alert>}

        <TextField label={t('login.email')} type="email" fullWidth required
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          sx={{ mb: 2 }} autoComplete="email"
        />

        <TextField
          label={t('login.password')} type={showPwd ? 'text' : 'password'} fullWidth required
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          sx={{ mb: 1 }} autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" size="small">
                  {showPwd
                    ? <VisibilityOffIcon sx={{ color: 'var(--bj-text-muted)', fontSize: 18 }} />
                    : <VisibilityIcon sx={{ color: 'var(--bj-text-muted)', fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ textAlign: 'right', mb: 2.5 }}>
          <Typography component={Link} to="/recuperar-password"
            sx={{ fontSize: '0.78rem', color: '#f0a500', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
            {t('login.forgotPassword')}
          </Typography>
        </Box>

        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 1.5 }}>
          {loading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : t('login.signIn')}
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2 }}>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'var(--bj-border)' }} />
          <Typography sx={{ fontSize: '0.75rem', color: 'var(--bj-text-muted)' }}>{t('login.or')}</Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'var(--bj-border)' }} />
        </Box>

        <Button variant="outlined" fullWidth onClick={() => navigate('/registro')}
          sx={{ borderColor: 'var(--bj-border)', color: 'var(--bj-text-muted)', textTransform: 'none', fontWeight: 400,
            '&:hover': { borderColor: '#f0a500', color: 'var(--bj-text)' } }}>
          {t('login.createAccount')}
        </Button>

        <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--bj-text-muted)', mt: 3 }}>
          {t('login.terms')}{' '}
          <Box component="span" sx={{ color: '#f0a500', cursor: 'pointer' }}>{t('login.termsLink')}</Box>
        </Typography>
      </Box>
    </Box>
  );
}
