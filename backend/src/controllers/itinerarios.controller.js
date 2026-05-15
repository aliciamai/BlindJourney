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

    let itinerario = await Itinerario.findOne({
      where:   { viaje_id: req.params.viajeId },
      include: [{
        model: Actividad,
        as:    'actividades',
        order: [['dia', 'ASC'], ['hora', 'ASC']],
      }],
    });

    // Si no existe itinerario, generarlo automáticamente
    if (!itinerario) {
      if (!viaje.destino_ciudad) {
        return res.status(409).json({ error: 'El destino aún no ha sido asignado' });
      }

      try {
        const perfil = await Perfil.findOne({ where: { usuario_id: req.usuario.id } });
        const dias = await geminiService.generarItinerario({
          ciudad:                    viaje.destino_ciudad,
          pais:                      viaje.destino_pais,
          diasViaje:                 viaje.duracion || 7,
          presupuestoDiario:         viaje.presupuesto ? viaje.presupuesto / (viaje.duracion || 7) : 100,
          intereses:                 perfil?.intereses                  || [],
          nivelActividad:            perfil?.nivel_actividad            || 'moderado',
          restriccionesAlimentarias: perfil?.restricciones_alimentarias || [],
        });

        itinerario = await Itinerario.create({
          viaje_id:        viaje.id,
          destino_ciudad:  viaje.destino_ciudad,
          destino_pais:    viaje.destino_pais,
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

        // Recargar itinerario con actividades
        itinerario = await Itinerario.findOne({
          where:   { id: itinerario.id },
          include: [{
            model: Actividad,
            as:    'actividades',
            order: [['dia', 'ASC'], ['hora', 'ASC']],
          }],
        });
      } catch (iaError) {
        console.error('[ITINERARIOS] ❌ ERROR AL GENERAR ITINERARIO - Ambas IAs fallaron:', iaError.message);
        console.error('[ITINERARIOS] Stack:', iaError.stack);
        return res.status(500).json({ error: 'No se pudo generar el itinerario. Intenta de nuevo más tarde.' });
      }
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

    // 1. Llamar a Gemini ANTES de tocar la BD
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

    // 2. Gemini respondió OK — ahora sí borramos el itinerario anterior
    const anterior = await Itinerario.findOne({ where: { viaje_id: viaje.id } });
    if (anterior) {
      await Actividad.destroy({ where: { itinerario_id: anterior.id } });
      await anterior.destroy();
    }

    // 3. Persistir el nuevo itinerario
    const itinerario = await Itinerario.create({
      viaje_id:        viaje.id,
      destino_ciudad:  viaje.destino_ciudad,
      destino_pais:    viaje.destino_pais,
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
      include: [{ model: Actividad, as: 'actividades' }],
    });

    res.json({ message: 'Itinerario generado correctamente', itinerario: completo });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/itinerarios/actividades/:actividadId ──────────
// Marca una actividad como importante o completada (swipe iOS)
const actualizarActividad = async (req, res, next) => {
  try {
    const { actividadId } = req.params;
    const { importante, completada } = req.body;

    const actividad = await Actividad.findByPk(actividadId);
    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' });

    // Verificar que el itinerario pertenece al usuario
    const itinerario = await Itinerario.findOne({
      where: { id: actividad.itinerario_id },
    });
    const viaje = await Viaje.findOne({
      where: { id: itinerario?.viaje_id, usuario_id: req.usuario.id },
    });
    if (!viaje) return res.status(403).json({ error: 'Sin permisos sobre esta actividad' });

    const campos = {};
    if (importante !== undefined) campos.importante = Boolean(importante);
    if (completada  !== undefined) campos.completada  = Boolean(completada);

    await actividad.update(campos);
    res.json({ message: 'Actividad actualizada', actividad });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/itinerarios/actividades/:actividadId ─────────
const eliminarActividad = async (req, res, next) => {
  try {
    const { actividadId } = req.params;

    const actividad = await Actividad.findByPk(actividadId);
    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' });

    const itinerario = await Itinerario.findOne({
      where: { id: actividad.itinerario_id },
    });
    const viaje = await Viaje.findOne({
      where: { id: itinerario?.viaje_id, usuario_id: req.usuario.id },
    });
    if (!viaje) return res.status(403).json({ error: 'Sin permisos sobre esta actividad' });

    await actividad.destroy();
    res.json({ message: 'Actividad eliminada' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerItinerarioDeViaje,
  regenerarItinerario,
  actualizarActividad,
  eliminarActividad,
};
