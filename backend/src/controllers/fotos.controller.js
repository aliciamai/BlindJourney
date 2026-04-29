// ============================================================
// BlindJourney – Controlador de Fotos (álbum de recuerdos)
// ============================================================

const { Foto, Viaje } = require('../models/index');

// ── GET /api/fotos/viaje/:viajeId ────────────────────────────
const listarFotosDeViaje = async (req, res, next) => {
  try {
    const viaje = await Viaje.findOne({
      where: { id: req.params.viajeId, usuario_id: req.usuario.id },
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

    const fotos = await Foto.findAll({
      where:      { viaje_id: req.params.viajeId, usuario_id: req.usuario.id, activo: true },
      order:      [['fecha_creacion', 'DESC']],
      attributes: { exclude: [] },
    });

    res.json(fotos);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/fotos/viaje/:viajeId ───────────────────────────
const subirFoto = async (req, res, next) => {
  try {
    const viaje = await Viaje.findOne({
      where: { id: req.params.viajeId, usuario_id: req.usuario.id },
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

    const { url, descripcion, ubicacion_nombre, latitud, longitud, fecha_foto } = req.body;
    if (!url) return res.status(400).json({ error: 'url es requerida' });

    const foto = await Foto.create({
      viaje_id:         viaje.id,
      usuario_id:       req.usuario.id,
      url,
      descripcion:      descripcion     || null,
      ubicacion_nombre: ubicacion_nombre|| null,
      latitud:          latitud != null ? parseFloat(latitud)  : null,
      longitud:         longitud != null ? parseFloat(longitud) : null,
      fecha_foto:       fecha_foto || new Date(),
    });

    res.status(201).json({ message: 'Foto añadida', foto });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/fotos/:id ────────────────────────────────────
const eliminarFoto = async (req, res, next) => {
  try {
    const foto = await Foto.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id, activo: true },
    });
    if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

    await foto.update({ activo: false });
    res.json({ message: 'Foto eliminada' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listarFotosDeViaje, subirFoto, eliminarFoto };
