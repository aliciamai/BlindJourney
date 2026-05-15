// ============================================================
// BlindJourney - Rutas de viajes
// ============================================================

const express = require('express');
const authMiddleware = require('../middlewares/jwt-auth.middleware');
const viajesController = require('../controllers/viajes.controller');

const router = express.Router();

router.get('/', authMiddleware, viajesController.listarViajes);
router.get('/:id', authMiddleware, viajesController.obtenerViajePorId);
router.post('/', authMiddleware, viajesController.crearViaje);
router.patch('/:id/revelar', authMiddleware, viajesController.revelarDestino);
router.patch('/:id/candidatos/:candidatoId/vetar', authMiddleware, viajesController.vetarCandidato);

module.exports = router;
