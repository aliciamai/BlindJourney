// ============================================================
// BlindJourney – Rutas de Autenticación
// Autora: Alicia Maillo
//
// Este archivo define los endpoints relacionados con el acceso
// al sistema: registro, login, verificación de email y
// recuperación de contraseña.
//
// Un Router de Express es como una mini-aplicación que agrupa
// rutas relacionadas. Luego se monta en app.js con un prefijo.
// ============================================================

const express    = require('express');
const router     = express.Router();

// Importamos el controlador: contiene la lógica de cada endpoint
// El router solo define QUÉ ruta hace QUÉ; el controlador hace el trabajo
const authController = require('../controllers/auth.controller');

// Importamos el middleware de validación de datos de entrada
// Sirve para verificar que el cuerpo de la petición tiene el formato correcto
// antes de que llegue al controlador (evita procesar datos incorrectos)
const { validarRegistro, validarLogin } = require('../middlewares/validacion.middleware');

// ── POST /api/auth/registro ───────────────────────────────────
// Crea una nueva cuenta de usuario.
// Recibe: { nombre, apellidos, email, password, telefono? }
// Devuelve: { message: "Email de verificación enviado" }
router.post('/registro', validarRegistro, authController.registro);

// ── POST /api/auth/login ──────────────────────────────────────
// Autentica al usuario y devuelve un JWT.
// Recibe: { email, password }
// Devuelve: { token, refreshToken, usuario: { id, nombre, email } }
router.post('/login', validarLogin, authController.login);

// ── POST /api/auth/logout ─────────────────────────────────────
// Invalida el refresh token del usuario.
// El JWT de acceso no se puede invalidar (es stateless), pero
// al borrar el refresh token el usuario no podrá renovarlo.
router.post('/logout', authController.logout);

// ── GET /api/auth/verificar/:token ───────────────────────────
// Activa la cuenta tras hacer clic en el enlace del email.
// El :token es el parámetro de la URL (ej: /verificar/abc123)
router.get('/verificar/:token', authController.verificarEmail);

// ── POST /api/auth/recuperar-password ────────────────────────
// Envía un email con enlace de recuperación.
// Recibe: { email }
router.post('/recuperar-password', authController.recuperarPassword);

// ── POST /api/auth/nueva-password ────────────────────────────
// Establece una nueva contraseña usando el token del email.
// Recibe: { token, nuevaPassword }
router.post('/nueva-password', authController.nuevaPassword);

// ── POST /api/auth/refresh ────────────────────────────────────
// Renueva el JWT de acceso usando el refresh token.
// Recibe: { refreshToken }
// Devuelve: { token } (nuevo JWT de acceso)
router.post('/refresh', authController.refresh);

module.exports = router;
