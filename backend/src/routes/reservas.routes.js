// ============================================================
// BlindJourney - Rutas de reservas
// ============================================================

const express = require('express');
const authMiddleware = require('../middlewares/jwt-auth.middleware');
const reservasController = require('../controllers/reservas.controller');

const router = express.Router();

router.get('/', authMiddleware, reservasController.listarReservas);
router.post('/', authMiddleware, reservasController.crearReserva);
router.patch('/:id/cancelar', authMiddleware, reservasController.cancelarReserva);
router.post('/:id/simular-pago', authMiddleware, reservasController.simularPago);

module.exports = router;
