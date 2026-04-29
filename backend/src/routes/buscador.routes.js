// ============================================================
// BlindJourney – Rutas del buscador de viajes (afiliados)
// ============================================================

const express = require('express');
const authMiddleware = require('../middlewares/jwt-auth.middleware');
const buscadorController = require('../controllers/buscador.controller');

const router = express.Router();

router.get('/links',          authMiddleware, buscadorController.generarLinks);
router.post('/registrar',     authMiddleware, buscadorController.registrar);
router.get('/estadisticas',   authMiddleware, buscadorController.estadisticas);

module.exports = router;
