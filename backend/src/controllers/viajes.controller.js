// ============================================================
// BlindJourney – Controlador de Viajes
// ============================================================

const { Viaje, Candidato, Perfil } = require('../models/index');
const geminiService = require('../services/gemini.service');

// ── GET /api/viajes ──────────────────────────────────────────
const listarViajes = async (req, res, next) => {
  try {
    const viajes = await Viaje.findAll({
      where:  { usuario_id: req.usuario.id },
      order:  [['fecha_creacion', 'DESC']],
    });
    res.json({ viajes, total: viajes.length });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/viajes/:id ──────────────────────────────────────
const obtenerViajePorId = async (req, res, next) => {
  try {
    const viaje = await Viaje.findOne({
      where:   { id: req.params.id, usuario_id: req.usuario.id },
      include: [{ model: Candidato, as: 'candidatos' }],
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
    res.json(viaje);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/viajes ─────────────────────────────────────────
// Crea el viaje y genera candidatos de destino con Gemini.
// El destino real queda oculto hasta la revelación.
const crearViaje = async (req, res, next) => {
  try {
    const { destino, presupuesto, fechaInicio, duracion } = req.body;

    const viaje = await Viaje.create({
      usuario_id:     req.usuario.id,
      destino_ciudad: destino   || null,
      presupuesto:    presupuesto || null,
      fecha_inicio:   fechaInicio || null,
      duracion:       duracion    || null,
      estado:         'pendiente',
    });

    // Intentar generar candidatos con IA; si falla el viaje ya se creó
    try {
      const perfil = await Perfil.findOne({ where: { usuario_id: req.usuario.id } });

      const candidatos = await geminiService.generarCandidatos({
        presupuesto:               presupuesto || 500,
        diasViaje:                 duracion    || 7,
        intereses:                 perfil?.intereses                    || [],
        nivelActividad:            perfil?.nivel_actividad              || 'moderado',
        restriccionesAlimentarias: perfil?.restricciones_alimentarias   || [],
        numViajeros:               1,
      });

      await Candidato.bulkCreate(
        candidatos.map(c => ({
          viaje_id:        viaje.id,
          ciudad:          c.ciudad,
          pais:            c.pais,
          tipo_viaje:      c.tipo_viaje,
          precio_estimado: c.precio_estimado,
          descripcion:     c.descripcion,
          clima:           c.clima,
          idioma:          c.idioma,
          duracion_vuelo:  c.duracion_vuelo,
        }))
      );
    } catch (iaError) {
      console.warn('[VIAJES] IA no disponible, viaje creado sin candidatos:', iaError.message);
    }

    res.status(201).json({ message: 'Viaje creado correctamente', viaje });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/viajes/:id/revelar ────────────────────────────
const revelarDestino = async (req, res, next) => {
  try {
    const viaje = await Viaje.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
    if (viaje.destino_revelado) {
      return res.status(409).json({ error: 'El destino ya fue revelado' });
    }

    await viaje.update({
      estado:           'revelado',
      destino_revelado: true,
      fecha_revelacion: new Date(),
    });

    await viaje.reload();

    res.json({ message: 'Destino revelado', viaje });
  } catch (error) {
    next(error);
  }
};

module.exports = { listarViajes, obtenerViajePorId, crearViaje, revelarDestino };
