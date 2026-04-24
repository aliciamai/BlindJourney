// ============================================================
// BlindJourney – Controlador de Notificaciones (RF-14)
// ============================================================

const { Notificacion } = require('../models/index');

// ── GET /api/notificaciones ──────────────────────────────
// Query params: pagina, limite, solo_no_leidas
const listarNotificaciones = async (req, res, next) => {
  try {
    const pagina  = Math.max(1, parseInt(req.query.pagina)  || 1);
    const limite  = Math.min(50, parseInt(req.query.limite) || 20);
    const soloNoLeidas = req.query.solo_no_leidas === 'true';

    const where = { usuario_id: req.usuario.id };
    if (soloNoLeidas) where.leida = false;

    const { count, rows } = await Notificacion.findAndCountAll({
      where,
      order:  [['fecha_creacion', 'DESC']],
      limit:  limite,
      offset: (pagina - 1) * limite,
    });

    res.json({
      items:   rows,
      total:   count,
      pagina,
      paginas: Math.ceil(count / limite),
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/notificaciones/:id/leer ──────────────────
const marcarLeida = async (req, res, next) => {
  try {
    const notificacion = await Notificacion.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });

    if (!notificacion) return res.status(404).json({ error: 'Notificación no encontrada' });

    await notificacion.update({ leida: true });
    res.json({ notificacion });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/notificaciones/leer-todas ────────────────
const marcarTodasLeidas = async (req, res, next) => {
  try {
    const [count] = await Notificacion.update(
      { leida: true },
      { where: { usuario_id: req.usuario.id, leida: false } }
    );
    res.json({ message: `${count} notificaciones marcadas como leídas` });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/notificaciones/:id ──────────────────────
const eliminarNotificacion = async (req, res, next) => {
  try {
    const eliminadas = await Notificacion.destroy({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });
    if (!eliminadas) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listarNotificaciones, marcarLeida, marcarTodasLeidas, eliminarNotificacion };
