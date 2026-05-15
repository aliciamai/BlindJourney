// ============================================================
// BlindJourney – API de Autenticación
// Autora: Alicia Maillo
//
// Funciones para llamar a los endpoints de autenticación (/api/auth).
// Usa una instancia de axios SIN interceptores de autenticación,
// ya que estos endpoints no requieren JWT (son públicos o usan refreshToken).
// ============================================================

// axios: librería HTTP
// Por qué instancia separada: estos endpoints son públicos y no necesitan JWT
import axios from 'axios';

// ── INSTANCIA SIN INTERCEPTORES ───────────────────────────────
// baseURL: '/api/auth' → todos los requests van a /api/auth/...
// No lleva interceptores de client.js porque estos endpoints son públicos
const base = axios.create({ baseURL: '/api/auth' });

// ── ENDPOINTS DE AUTENTICACIÓN ────────────────────────────────

/**
 * Autentica un usuario con email y contraseña.
 * Devuelve: { token (JWT), refreshToken, usuario }
 */
export const loginApi = (email, password) =>
  base.post('/login', { email, password }).then((r) => r.data);

/**
 * Crea una nueva cuenta de usuario.
 * Devuelve: { token, refreshToken, usuario }
 */
export const registroApi = (data) =>
  base.post('/registro', data).then((r) => r.data);

/**
 * Cierra la sesión notificando al backend.
 * El servidor invalida el refreshToken en su base de datos.
 */
export const logoutApi = (refreshToken) =>
  base.post('/logout', { refreshToken }).then((r) => r.data);

/**
 * Renueva el JWT usando el refreshToken.
 * Se usa cuando el JWT de acceso está próximo a expirar.
 * Devuelve: { token (nuevo JWT), expiresIn }
 */
export const refreshTokenApi = (refreshToken) =>
  base.post('/refresh', { refreshToken }).then((r) => r.data);

/**
 * Inicia el proceso de recuperación de contraseña.
 * Backend envía un email con un link de reset al usuario.
 * Nota: No se usa en la interfaz actual, pero está disponible para futuras features.
 */
export const recuperarPasswordApi = (email) =>
  base.post('/recuperar-password', { email }).then((r) => r.data);

/**
 * Establece una nueva contraseña usando el token de reset.
 * El token proviene del email de recuperación de contraseña.
 * Nota: No se usa en la interfaz actual, pero está disponible para futuras features.
 */
export const nuevaPasswordApi = (token, password) =>
  base.post('/nueva-password', { token, password }).then((r) => r.data);
