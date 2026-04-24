// ============================================================
// BlindJourney - Middleware de autenticacion JWT
// ============================================================

const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso no autorizado. Token requerido.',
      code: 'NO_TOKEN',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = {
      id: payload.usuarioId,
      email: payload.email,
      nombre: payload.nombre,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Por favor, renueva tu sesion.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      error: 'Token invalido.',
      code: 'INVALID_TOKEN',
    });
  }
};

module.exports = jwtAuthMiddleware;
