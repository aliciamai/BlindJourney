// ============================================================
// BlindJourney – Rutas de notificaciones (RF-14)
// ============================================================

const express = require('express');
const authMiddleware            = require('../middlewares/jwt-auth.middleware');
const notificacionesController  = require('../controllers/notificaciones.controller');

const router = express.Router();

// ⚠️ /leer-todas debe ir ANTES de /:id/leer para evitar que Express
// interprete "leer-todas" como un parámetro :id.
router.get('/',                   authMiddleware, notificacionesController.listarNotificaciones);
router.patch('/leer-todas',       authMiddleware, notificacionesController.marcarTodasLeidas);
router.patch('/:id/leer',         authMiddleware, notificacionesController.marcarLeida);
router.delete('/:id',             authMiddleware, notificacionesController.eliminarNotificacion);

module.exports = router;
