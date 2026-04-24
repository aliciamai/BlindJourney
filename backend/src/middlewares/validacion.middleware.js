// ============================================================
// BlindJourney - Middlewares de validacion
// ============================================================

const { body, validationResult } = require('express-validator');

const manejarErroresValidacion = (req, res, next) => {
  const errores = validationResult(req);

  if (errores.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    error: 'Datos de entrada no validos',
    detalles: errores.array().map((error) => ({
      campo: error.path,
      mensaje: error.msg,
    })),
  });
};

const validarRegistro = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellidos').trim().notEmpty().withMessage('Los apellidos son obligatorios'),
  body('email').isEmail().withMessage('Debes indicar un email valido').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La password debe tener al menos 8 caracteres'),
  body('telefono')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('El telefono debe ser texto'),
  manejarErroresValidacion,
];

const validarLogin = [
  body('email').isEmail().withMessage('Debes indicar un email valido').normalizeEmail(),
  body('password').notEmpty().withMessage('La password es obligatoria'),
  manejarErroresValidacion,
];

module.exports = {
  validarRegistro,
  validarLogin,
  manejarErroresValidacion,
};
