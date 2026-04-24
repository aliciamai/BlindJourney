// ============================================================
// BlindJourney – Controlador de Itinerarios
// ============================================================

const { Itinerario, Actividad, Viaje, Perfil } = require('../models/index');
const geminiService = require('../services/gemini.service');

// ── GET /api/itinerarios/viaje/:viajeId ─────────────────────
const obtenerItinerarioDeViaje = async (req, res, next) => {
  try {
    const viaje = await Viaje.findOne({
      where: { id: req.params.viajeId, usuario_id: req.usuario.id },
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

    const itinerario = await Itinerario.findOne({
      where:   { viaje_id: req.params.viajeId },
      include: [{
        model: Actividad,
        as:    'actividades',
        order: [['dia', 'ASC'], ['hora', 'ASC']],
      }],
    });
    if (!itinerario) {
      return res.status(404).json({ error: 'Este viaje aún no tiene itinerario generado' });
    }

    res.json(itinerario);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/itinerarios/viaje/:viajeId/regenerar ──────────
const regenerarItinerario = async (req, res, next) => {
  try {
    const viaje = await Viaje.findOne({
      where: { id: req.params.viajeId, usuario_id: req.usuario.id },
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
    if (!viaje.destino_revelado) {
      return res.status(409).json({ error: 'El destino aún no ha sido revelado' });
    }

    // Borrar itinerario anterior si existe
    const anterior = await Itinerario.findOne({ where: { viaje_id: viaje.id } });
    if (anterior) {
      await Actividad.destroy({ where: { itinerario_id: anterior.id } });
      await anterior.destroy();
    }

    const perfil = await Perfil.findOne({ where: { usuario_id: req.usuario.id } });
    const dias = await geminiService.generarItinerario({
      ciudad:                    viaje.destino_ciudad,
      pais:                      viaje.destino_pais,
      diasViaje:                 viaje.duracion || 7,
      presupuestoDiario:         viaje.presupuesto
                                   ? viaje.presupuesto / (viaje.duracion || 7)
                                   : 100,
      intereses:                 perfil?.intereses                  || [],
      nivelActividad:            perfil?.nivel_actividad            || 'moderado',
      restriccionesAlimentarias: perfil?.restricciones_alimentarias || [],
    });

    const itinerario = await Itinerario.create({
      viaje_id:       viaje.id,
      destino_ciudad: viaje.destino_ciudad,
      destino_pais:   viaje.destino_pais,
      generado_por_ia: true,
    });

    for (const dia of dias) {
      for (const act of dia.actividades || []) {
        await Actividad.create({
          itinerario_id:    itinerario.id,
          dia:              dia.dia,
          hora:             act.hora,
          nombre:           act.nombre,
          descripcion:      act.descripcion,
          tipo:             act.tipo,
          ubicacion:        act.ubicacion,
          duracion_minutos: act.duracion_minutos,
          coste_estimado:   act.coste_estimado,
        });
      }
    }

    const completo = await Itinerario.findOne({
      where:   { id: itinerario.id },
      include: [{
        model: Actividad,
        as:    'actividades',
        order: [['dia', 'ASC'], ['hora', 'ASC']],
      }],
    });

    res.json({ message: 'Itinerario generado correctamente', itinerario: completo });
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerItinerarioDeViaje, regenerarItinerario };
