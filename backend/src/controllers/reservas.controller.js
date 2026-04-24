// ============================================================
// BlindJourney – Controlador de Reservas
// ============================================================

const { Reserva, Viaje } = require('../models/index');

// ── GET /api/reservas ────────────────────────────────────────
const listarReservas = async (req, res, next) => {
  try {
    const reservas = await Reserva.findAll({
      include: [{
        model:      Viaje,
        as:         'viaje',
        where:      { usuario_id: req.usuario.id },
        attributes: ['id', 'destino_ciudad', 'destino_pais', 'fecha_inicio', 'destino_revelado'],
      }],
      order: [['fecha_creacion', 'DESC']],
    });
    res.json({ items: reservas, total: reservas.length });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/reservas ───────────────────────────────────────
const crearReserva = async (req, res, next) => {
  try {
    const { viajeId, hotel, transporte } = req.body;

    // Verificar que el viaje pertenece al usuario
    const viaje = await Viaje.findOne({
      where: { id: viajeId, usuario_id: req.usuario.id },
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

    const reserva = await Reserva.create({
      viaje_id:    viajeId,
      alojamiento: hotel        || null,
      transporte:  transporte   || null,
      estado:      'pendiente',
    });

    res.status(201).json({ message: 'Reserva creada', reserva });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/reservas/:id/cancelar ────────────────────────
const cancelarReserva = async (req, res, next) => {
  try {
    const reserva = await Reserva.findOne({
      where:   { id: req.params.id },
      include: [{
        model: Viaje,
        as:    'viaje',
        where: { usuario_id: req.usuario.id },
      }],
    });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.estado === 'cancelada') {
      return res.status(409).json({ error: 'La reserva ya está cancelada' });
    }

    await reserva.update({ estado: 'cancelada' });
    res.json({ message: 'Reserva cancelada', reserva });
  } catch (error) {
    next(error);
  }
};

module.exports = { listarReservas, crearReserva, cancelarReserva };
