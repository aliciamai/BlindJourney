// ============================================================
// BlindJourney – Controlador de Autenticación
// Autora: Alicia Maillo
//
// Los controladores contienen la lógica de cada endpoint.
// Reciben la petición (req), procesan los datos, llaman a los
// modelos de base de datos y devuelven la respuesta (res).
//
// Patrón usado: async/await con try/catch para manejar errores
// asíncronos de forma limpia y legible.
// ============================================================

// bcrypt es la librería estándar para hacer hash de contraseñas
// NUNCA guardamos contraseñas en texto plano en la base de datos
const bcrypt = require('bcryptjs');

// jsonwebtoken nos permite crear y verificar tokens JWT
// Un JWT es una cadena cifrada que contiene datos del usuario
// y tiene fecha de expiración
const jwt = require('jsonwebtoken');

// crypto es un módulo nativo de Node.js para generar valores aleatorios
// Lo usamos para crear tokens de verificación de email únicos
const crypto = require('crypto');

// Modelo de Usuario: contiene las queries SQL para la tabla 'usuarios'
const UsuarioModel = require('../models/usuario.model');

// Servicio de email: envía los correos de verificación y recuperación
const emailService = require('../services/email.service');

// ── REGISTRO ─────────────────────────────────────────────────
/**
 * Crea una nueva cuenta de usuario.
 * Pasos: validar → comprobar duplicado → hashear password → guardar → enviar email
 */
const registro = async (req, res, next) => {
  try {
    // Extraemos los datos del cuerpo de la petición
    // La validación ya la hizo el middleware antes de llegar aquí
    const { nombre, apellidos, email, password, telefono } = req.body;

    // Comprobamos que el email no está ya registrado
    // Si existe, devolvemos un 409 Conflict (no un 500, que sería un error del servidor)
    const usuarioExistente = await UsuarioModel.buscarPorEmail(email);
    if (usuarioExistente) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    // Hasheamos la contraseña con bcrypt.
    // El '12' es el "cost factor": cuanto mayor, más seguro pero más lento.
    // 12 es un buen equilibrio entre seguridad y rendimiento (aprox. 250ms)
    const passwordHash = await bcrypt.hash(password, 12);

    // TODO: Temporal - activar email automáticamente. Cambiar a verificación cuando haya servicio de email.
    const nuevoUsuario = await UsuarioModel.crear({
      nombre,
      apellidos,
      email,
      passwordHash,
      telefono: telefono || null,
      emailVerificado: true,
    });

    // Respondemos con 201 Created (no 200, porque hemos creado un recurso)
    res.status(201).json({
      message: 'Cuenta creada correctamente. Puedes iniciar sesión.',
      usuarioId: nuevoUsuario.id,
    });

  } catch (error) {
    // next(error) pasa el error al middleware global de errores en app.js
    // Así no duplicamos el manejo de errores en cada controlador
    next(error);
  }
};

// ── LOGIN ─────────────────────────────────────────────────────
/**
 * Autentica al usuario y devuelve un JWT de acceso y un refresh token.
 *
 * Sobre los tokens:
 * - JWT de acceso: corta duración (24h). Se envía en cada petición.
 * - Refresh token: larga duración (7 días). Solo se usa para renovar el JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscamos el usuario por email
    const usuario = await UsuarioModel.buscarPorEmail(email);

    // Ojo: usamos el MISMO mensaje de error si el email no existe
    // o si la contraseña es incorrecta. Si diferenciáramos ambos casos,
    // un atacante podría averiguar qué emails están registrados.
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // bcrypt.compare compara la contraseña enviada con el hash guardado
    // Internamente extrae el salt del hash y lo aplica al texto plano
    const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordCorrecta) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Comprobamos que el email está verificado
    if (!usuario.email_verificado) {
      return res.status(403).json({
        error: 'Debes verificar tu email antes de iniciar sesión',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Creamos el JWT de acceso.
    // El payload contiene datos del usuario que NO son sensibles.
    // NO incluyas contraseñas, datos bancarios, etc. en un JWT.
    const token = jwt.sign(
      {
        usuarioId: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
      },
      process.env.JWT_SECRET,        // Clave secreta del .env
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Creamos el refresh token (un token diferente, más largo)
    const refreshToken = jwt.sign(
      { usuarioId: usuario.id, tipo: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Guardamos el refresh token en la BD para poder invalidarlo en logout
    await UsuarioModel.guardarRefreshToken(usuario.id, refreshToken);

    res.json({
      token,
      refreshToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        idioma: usuario.idioma,
      },
    });

  } catch (error) {
    next(error);
  }
};

// ── LOGOUT ───────────────────────────────────────────────────
/**
 * Invalida el refresh token del usuario.
 * El JWT de acceso expirará solo (no podemos invalidarlo, es stateless).
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Eliminamos el refresh token de la BD
      await UsuarioModel.eliminarRefreshToken(refreshToken);
    }

    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};

// ── VERIFICAR EMAIL ───────────────────────────────────────────
/**
 * Activa la cuenta del usuario cuando hace clic en el enlace del email.
 * El token viene en la URL: /api/auth/verificar/:token
 */
const verificarEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Buscamos el usuario que tiene ese token de verificación
    const usuario = await UsuarioModel.buscarPorTokenVerificacion(token);

    if (!usuario) {
      return res.status(400).json({
        error: 'Token de verificación inválido o ya utilizado'
      });
    }

    // Marcamos el email como verificado y borramos el token
    // (un token de un solo uso no debe poder reutilizarse)
    await UsuarioModel.verificarEmail(usuario.id);

    // Redirigimos al login del frontend con un mensaje de éxito
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);

  } catch (error) {
    next(error);
  }
};

// ── RECUPERAR PASSWORD ────────────────────────────────────────
/**
 * Genera un token temporal y envía el email de recuperación.
 */
const recuperarPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const usuario = await UsuarioModel.buscarPorEmail(email);

    // Importante: respondemos lo mismo tanto si el email existe como si no.
    // Así evitamos revelar qué emails están registrados en el sistema.
    const mensajeGenerico = 'Si ese email está registrado, recibirás instrucciones en breve.';

    if (!usuario) {
      return res.json({ message: mensajeGenerico });
    }

    // El token expira en 1 hora (3600 segundos)
    const tokenReset = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date(Date.now() + 3600 * 1000);

    await UsuarioModel.guardarTokenReset(usuario.id, tokenReset, expiracion);

    emailService.enviarRecuperacion(email, usuario.nombre, tokenReset)
      .catch(err => console.error('[EMAIL] Error al enviar recuperación:', err));

    res.json({ message: mensajeGenerico });

  } catch (error) {
    next(error);
  }
};

// ── NUEVA PASSWORD ────────────────────────────────────────────
/**
 * Establece la nueva contraseña usando el token recibido por email.
 */
const nuevaPassword = async (req, res, next) => {
  try {
    const { token, nuevaPassword } = req.body;

    // Buscamos el usuario con ese token de reset Y que no haya expirado
    const usuario = await UsuarioModel.buscarPorTokenReset(token);

    if (!usuario) {
      return res.status(400).json({
        error: 'Token inválido o expirado. Solicita un nuevo enlace.'
      });
    }

    // Hasheamos la nueva contraseña antes de guardarla
    const passwordHash = await bcrypt.hash(nuevaPassword, 12);

    // Actualizamos la contraseña y borramos el token de reset
    await UsuarioModel.actualizarPassword(usuario.id, passwordHash);

    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    next(error);
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────
/**
 * Renueva el JWT de acceso usando el refresh token.
 * Se llama desde el frontend cuando el JWT de acceso expira.
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    // Verificamos que el refresh token es válido (no expirado, no manipulado)
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    // Comprobamos que el refresh token existe en la BD (no fue revocado)
    const tokenValido = await UsuarioModel.verificarRefreshToken(
      payload.usuarioId,
      refreshToken
    );

    if (!tokenValido) {
      return res.status(401).json({ error: 'Refresh token revocado' });
    }

    // Buscamos el usuario para incluir sus datos en el nuevo JWT
    const usuario = await UsuarioModel.buscarPorId(payload.usuarioId);

    // Generamos un nuevo JWT de acceso
    const nuevoToken = jwt.sign(
      { usuarioId: usuario.id, email: usuario.email, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ token: nuevoToken });

  } catch (error) {
    next(error);
  }
};

// Exportamos todas las funciones del controlador
module.exports = {
  registro,
  login,
  logout,
  verificarEmail,
  recuperarPassword,
  nuevaPassword,
  refresh,
};
