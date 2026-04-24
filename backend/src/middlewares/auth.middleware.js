// ============================================================
// BlindJourney – Middleware de Autenticación JWT
// Autora: Alicia Maillo
//
// Un middleware es una función que se ejecuta ENTRE la llegada
// de la petición y el controlador. Si algo falla, devuelve un
// error y la petición no llega al controlador.
//
// Este middleware protege rutas privadas: comprueba que la
// petición incluye un JWT válido antes de continuar.
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación.
 * 
 * Uso en rutas:
 *   router.get('/mis-viajes', authMiddleware, viajesController.listar);
 * 
 * El JWT debe venir en la cabecera HTTP:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 */
const authMiddleware = (req, res, next) => {
  // Extraemos la cabecera Authorization de la petición
  const authHeader = req.headers['authorization'];

  // Si no hay cabecera o no tiene el formato "Bearer <token>", rechazamos
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso no autorizado. Token requerido.',
      code: 'NO_TOKEN',
    });
  }

  // Extraemos solo el token (eliminamos el prefijo "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify lanza una excepción si el token es inválido o ha expirado
    // Si es válido, devuelve el payload que codificamos al crear el JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Añadimos los datos del usuario a req para que los controladores
    // puedan acceder a ellos sin necesidad de consultar la BD de nuevo
    req.usuario = {
      id: payload.usuarioId,
      email: payload.email,
      nombre: payload.nombre,
    };

    // next() indica a Express que puede continuar con el siguiente
    // middleware o con el controlador de la ruta
    next();

  } catch (error) {
    // TokenExpiredError: el token expiró (el frontend debe usar refresh)
    // JsonWebTokenError: el token fue manipulado o es inválido
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Por favor, renueva tu sesión.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      error: 'Token inválido.',
      code: 'INVALID_TOKEN',
    });
  }
};

module.exports = authMiddleware;
