// ============================================================
// BlindJourney – Controlador de Reservas
// ============================================================

const { Reserva, Viaje, Pago, Candidato } = require('../models/index');

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
    const { viaje_id, hotel, transporte } = req.body;

    // Verificar que el viaje pertenece al usuario
    const viaje = await Viaje.findOne({
      where: { id: viaje_id, usuario_id: req.usuario.id },
      include: [{ model: Candidato, as: 'candidatos' }],
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

    // Elegir un destino al azar de los candidatos NO vetados, evitando destinos duplicados
    const candidatosDisponibles = viaje.candidatos.filter((c) => !c.vetado);
    if (candidatosDisponibles.length > 0) {
      // Obtener todos los viajes anteriores del usuario
      const viajesAnteriores = await Viaje.findAll({
        where: { usuario_id: req.usuario.id, id: { [require('sequelize').Op.ne]: viaje_id } },
        attributes: ['destino_ciudad', 'destino_pais'],
      });

      // Extraer los destinos que ya tiene
      const destinosYaVisitados = viajesAnteriores
        .filter((v) => v.destino_ciudad && v.destino_pais)
        .map((v) => `${v.destino_ciudad.toLowerCase()}|${v.destino_pais.toLowerCase()}`);

      // Filtrar candidatos para excluir destinos duplicados
      const candidatosSinDuplicados = candidatosDisponibles.filter((c) => {
        const destinoKey = `${c.ciudad.toLowerCase()}|${c.pais.toLowerCase()}`;
        return !destinosYaVisitados.includes(destinoKey);
      });

      // Elegir de candidatos únicos si los hay, sino de disponibles
      const listaCandidatos = candidatosSinDuplicados.length > 0 ? candidatosSinDuplicados : candidatosDisponibles;
      const destinoElegido = listaCandidatos[Math.floor(Math.random() * listaCandidatos.length)];

      await viaje.update({
        destino_ciudad: destinoElegido.ciudad,
        destino_pais: destinoElegido.pais,
      });
    }

    const reserva = await Reserva.create({
      viaje_id:    viaje_id,
      alojamiento: hotel        || null,
      transporte:  transporte   || null,
      estado:      'pendiente',
    });

    res.status(201).json({
      message: 'Reserva creada',
      reserva: {
        id: reserva.id,
        viaje_id: reserva.viaje_id,
        estado: reserva.estado,
        alojamiento: reserva.alojamiento,
        transporte: reserva.transporte,
      }
    });
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

// ── POST /api/reservas/:id/simular-pago ──────────────────────
const simularPago = async (req, res, next) => {
  try {
    const reserva = await Reserva.findOne({
      where:   { id: req.params.id },
      include: [{ model: Viaje, as: 'viaje', where: { usuario_id: req.usuario.id } }],
    });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.estado === 'confirmada') {
      return res.status(409).json({ error: 'La reserva ya está confirmada y pagada' });
    }

    const viaje = reserva.viaje;

    const pago = await Pago.create({
      reserva_id:               reserva.id,
      stripe_payment_intent_id: 'pi_demo_' + Date.now(),
      importe:                  viaje.presupuesto * (viaje.num_viajeros || 1),
      moneda:                   'eur',
      estado:                   'completado',
      fecha_pago:               new Date(),
    });

    await reserva.update({ estado: 'confirmada' });
    const fechaSalida = new Date(viaje.fecha_inicio);
    const revelarEn = new Date(fechaSalida.getTime() - 48 * 60 * 60 * 1000);
    await viaje.update({ estado: 'confirmado', revelar_en: revelarEn });

    res.json({ success: true, reserva, viaje, pago });
  } catch (error) {
    next(error);
  }
};

module.exports = { listarReservas, crearReserva, cancelarReserva, simularPago };
