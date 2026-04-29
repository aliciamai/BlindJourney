// ============================================================
// BlindJourney – Controlador de Documentos (RF-13)
// ============================================================

const { Documento, Viaje } = require('../models/index');

// ── GET /api/documentos ─────────────────────────────────
const listarDocumentos = async (req, res, next) => {
  try {
    const documentos = await Documento.findAll({
      where: { usuario_id: req.usuario.id, activo: true },
      order: [['fecha_creacion', 'DESC']],
    });
    res.json({ documentos });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/documentos/viaje/:viajeId ──────────────────
const listarDocumentosDeViaje = async (req, res, next) => {
  try {
    const viaje = await Viaje.findOne({
      where: { id: req.params.viajeId, usuario_id: req.usuario.id },
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

    const documentos = await Documento.findAll({
      where: { usuario_id: req.usuario.id, viaje_id: req.params.viajeId, activo: true },
      order: [['fecha_creacion', 'DESC']],
    });
    res.json({ documentos });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/documentos ────────────────────────────────
// El frontend sube el archivo a S3 y nos envía la URL resultante en url_storage
const crearDocumento = async (req, res, next) => {
  try {
    const { nombre, tipo, viaje_id, nombre_archivo, url_storage, descripcion, fecha_expiracion } = req.body;

    if (viaje_id) {
      const viaje = await Viaje.findOne({ where: { id: viaje_id, usuario_id: req.usuario.id } });
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    const documento = await Documento.create({
      usuario_id:       req.usuario.id,
      viaje_id:         viaje_id         || null,
      tipo:             tipo             || 'otro',
      nombre,
      nombre_archivo:   nombre_archivo   || null,
      url_storage:      url_storage      || null,
      descripcion:      descripcion      || null,
      fecha_expiracion: fecha_expiracion || null,
    });

    res.status(201).json({ documento });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/documentos/:id ─────────────────────────────
const actualizarDocumento = async (req, res, next) => {
  try {
    const documento = await Documento.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id, activo: true },
    });
    if (!documento) return res.status(404).json({ error: 'Documento no encontrado' });

    const { nombre, tipo, descripcion, fecha_expiracion, url_storage } = req.body;
    const datos = {};
    if (nombre           !== undefined) datos.nombre           = nombre;
    if (tipo             !== undefined) datos.tipo             = tipo;
    if (descripcion      !== undefined) datos.descripcion      = descripcion;
    if (fecha_expiracion !== undefined) datos.fecha_expiracion = fecha_expiracion;
    if (url_storage      !== undefined) datos.url_storage      = url_storage;

    await documento.update(datos);
    res.json({ documento });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/documentos/:id ──────────────────────────
// Soft delete: marca activo=false, no borra el registro
const eliminarDocumento = async (req, res, next) => {
  try {
    const documento = await Documento.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id, activo: true },
    });
    if (!documento) return res.status(404).json({ error: 'Documento no encontrado' });

    await documento.update({ activo: false });
    res.json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarDocumentos,
  listarDocumentosDeViaje,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
};
