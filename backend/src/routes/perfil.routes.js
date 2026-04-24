// ============================================================
// BlindJourney - Rutas de perfil
// ============================================================

const express = require('express');
const authMiddleware = require('../middlewares/jwt-auth.middleware');
const perfilController = require('../controllers/perfil.controller');

const router = express.Router();

router.get('/me', authMiddleware, perfilController.obtenerPerfil);
router.put('/me', authMiddleware, perfilController.actualizarPerfil);

module.exports = router;
