// ============================================================
// BlindJourney – Rutas del álbum de fotos
// ============================================================

const express = require('express');
const authMiddleware = require('../middlewares/jwt-auth.middleware');
const fotosController = require('../controllers/fotos.controller');

const router = express.Router();

router.get('/viaje/:viajeId', authMiddleware, fotosController.listarFotosDeViaje);
router.post('/viaje/:viajeId', authMiddleware, fotosController.subirFoto);
router.delete('/:id',         authMiddleware, fotosController.eliminarFoto);

module.exports = router;
