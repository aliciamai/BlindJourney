// ============================================================
// BlindJourney - Rutas de itinerarios
// ============================================================

const express = require('express');
const authMiddleware = require('../middlewares/jwt-auth.middleware');
const itinerariosController = require('../controllers/itinerarios.controller');

const router = express.Router();

router.get('/viaje/:viajeId', authMiddleware, itinerariosController.obtenerItinerarioDeViaje);
router.post('/viaje/:viajeId/regenerar', authMiddleware, itinerariosController.regenerarItinerario);

module.exports = router;
