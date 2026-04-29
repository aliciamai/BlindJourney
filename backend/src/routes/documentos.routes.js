// ============================================================
// BlindJourney – Rutas de documentos (RF-13)
// ============================================================

const express = require('express');
const authMiddleware        = require('../middlewares/jwt-auth.middleware');
const documentosController  = require('../controllers/documentos.controller');

const router = express.Router();

router.get('/',                         authMiddleware, documentosController.listarDocumentos);
router.get('/viaje/:viajeId',           authMiddleware, documentosController.listarDocumentosDeViaje);
router.post('/',                        authMiddleware, documentosController.crearDocumento);
router.put('/:id',                      authMiddleware, documentosController.actualizarDocumento);
router.delete('/:id',                   authMiddleware, documentosController.eliminarDocumento);

module.exports = router;
