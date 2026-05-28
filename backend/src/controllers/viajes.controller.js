// ============================================================
// BlindJourney – Controlador de Viajes
// ============================================================

const { Viaje, Candidato, Perfil, Itinerario, Actividad } = require('../models/index');
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
    const { destino, presupuesto, fecha_inicio, fecha_fin, duracion, num_viajeros, idioma } = req.body;

    const viaje = await Viaje.create({
      usuario_id:     req.usuario.id,
      destino_ciudad: destino      || null,
      presupuesto:    presupuesto  || null,
      fecha_inicio:   fecha_inicio || null,
      fecha_fin:      fecha_fin    || null,
      duracion:       duracion     || null,
      num_viajeros:   num_viajeros || 1,
      estado:         'pendiente',
    });

    // Intentar generar candidatos con IA; si falla el viaje ya se creó
    let candidatos = [];
    try {
      const perfil = await Perfil.findOne({ where: { usuario_id: req.usuario.id } });

      const generados = await geminiService.generarCandidatos({
        presupuesto:               presupuesto || 500,
        diasViaje:                 duracion    || 7,
        intereses:                 perfil?.intereses                    || [],
        nivelActividad:            perfil?.nivel_actividad              || 'moderado',
        restriccionesAlimentarias: perfil?.restricciones_alimentarias   || [],
        numViajeros:               viaje.num_viajeros || 1,
        idioma:                    idioma || 'es',
      });

      if (generados && generados.length > 0) {
        const creados = await Candidato.bulkCreate(
          generados.map(c => ({
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
        candidatos = creados;
      }
    } catch (err) {
      console.error('[VIAJES] ❌ ERROR AL GENERAR CANDIDATOS - Ambas IAs fallaron:', err.message);
      console.error('[VIAJES] Stack:', err.stack);
      console.warn('[VIAJES] Usando candidatos simulados como fallback');
      const candidatosSimulados = [
        { ciudad: 'Barcelona', pais: 'España', tipo_viaje: 'cultura', precio_estimado: 850, descripcion: 'La modernidad de Gaudí y playas mediterráneas. Explora la Sagrada Familia, Park Güell y el barrio gótico.', clima: 'Templado, 18-25°C', idioma: 'Catalán/Español', duracion_vuelo: '2h desde Madrid' },
        { ciudad: 'Estambul', pais: 'Turquía', tipo_viaje: 'cultura', precio_estimado: 920, descripcion: 'Donde Oriente y Occidente se encuentran. Descubre la Mezquita Azul, el Palacio de Topkapi y bazares antiguos.', clima: 'Templado, 15-22°C', idioma: 'Turco', duracion_vuelo: '4h desde Madrid' },
        { ciudad: 'Marrakech', pais: 'Marruecos', tipo_viaje: 'cultura', precio_estimado: 750, descripcion: 'Colores vibrantes y aromas exóticos. Pasea por la plaza Jemaa el-Fnaa y los souks tradicionales.', clima: 'Cálido, 20-28°C', idioma: 'Árabe', duracion_vuelo: '1h 30min desde Madrid' },
        { ciudad: 'Reikiavik', pais: 'Islandia', tipo_viaje: 'naturaleza', precio_estimado: 1100, descripcion: 'Auroras boreales y naturaleza salvaje. Visita cascadas, geyseres y la Laguna Azul.', clima: 'Frío, -2 a 5°C', idioma: 'Islandés', duracion_vuelo: '4h 30min desde Madrid' },
        { ciudad: 'Bangkok', pais: 'Tailandia', tipo_viaje: 'gastronomia', precio_estimado: 680, descripcion: 'Templos dorados y comida callejera deliciosa. Explora el Palacio Real y los mercados flotantes.', clima: 'Tropical, 25-35°C', idioma: 'Tailandés', duracion_vuelo: '12h desde Madrid' },
        { ciudad: 'Bali', pais: 'Indonesia', tipo_viaje: 'playa', precio_estimado: 820, descripcion: 'Playas de arena blanca y templos antiguos. Relájate en Seminyak o explora los arrozales de Ubud.', clima: 'Tropical, 26-32°C', idioma: 'Indonesio', duracion_vuelo: '15h desde Madrid' },
        { ciudad: 'Roma', pais: 'Italia', tipo_viaje: 'cultura', precio_estimado: 900, descripcion: 'La ciudad eterna llena de historia. Coliseo, Vaticano y pastas auténticas en cada esquina.', clima: 'Templado, 10-25°C', idioma: 'Italiano', duracion_vuelo: '2h 30min desde Madrid' },
        { ciudad: 'Queenstown', pais: 'Nueva Zelanda', tipo_viaje: 'montana', precio_estimado: 1200, descripcion: 'Aventura extrema rodeada de montañas. Paracaidismo, bungee jumping y paisajes de película.', clima: 'Templado, 8-20°C', idioma: 'Inglés', duracion_vuelo: '20h desde Madrid' },
        { ciudad: 'Santorini', pais: 'Grecia', tipo_viaje: 'playa', precio_estimado: 1000, descripcion: 'Atardeceres de ensueño y vino local. Casas blancas con vista al mar Egeo y playas volcánicas.', clima: 'Templado, 15-28°C', idioma: 'Griego', duracion_vuelo: '3h desde Madrid' },
        { ciudad: 'Kyoto', pais: 'Japón', tipo_viaje: 'cultura', precio_estimado: 1050, descripcion: 'Templos milenarios entre bambú. Pasea por miles de torii rojos en Fushimi Inari.', clima: 'Templado, 5-28°C', idioma: 'Japonés', duracion_vuelo: '13h desde Madrid' },
      ];
      const creados = await Candidato.bulkCreate(
        candidatosSimulados.map(c => ({
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
      candidatos = creados;
    }

    res.status(201).json({
      message: 'Viaje creado correctamente',
      viaje: {
        ...viaje.toJSON(),
        candidatos,
      },
      candidatos,
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/viajes/:id/revelar ────────────────────────────
const revelarDestino = async (req, res, next) => {
  try {
    const { idioma } = req.body;
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

    // Generar itinerario automáticamente cuando se revela el destino
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
        idioma:                    idioma || 'es',
      });

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
    } catch (iaError) {
      console.error('[VIAJES] ❌ ERROR AL GENERAR ITINERARIO al revelar destino:', iaError.message);
      console.error('[VIAJES] Stack:', iaError.stack);
    }

    await viaje.reload();

    res.json({ message: 'Destino revelado', viaje });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/viajes/:id/candidatos/:candidatoId/vetar ──────
const vetarCandidato = async (req, res, next) => {
  try {
    const { id, candidatoId } = req.params;

    // Verificar que el viaje pertenece al usuario
    const viaje = await Viaje.findOne({
      where: { id, usuario_id: req.usuario.id },
      include: [{ model: Candidato, as: 'candidatos' }],
    });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

    const candidato = await Candidato.findOne({
      where: { id: candidatoId, viaje_id: id },
    });
    if (!candidato) return res.status(404).json({ error: 'Candidato no encontrado' });

    await candidato.update({ vetado: true });
    const candidatosActuales = await Candidato.findAll({ where: { viaje_id: id } });

    res.json({ candidatos: candidatosActuales });
  } catch (error) {
    next(error);
  }
};

module.exports = { listarViajes, obtenerViajePorId, crearViaje, revelarDestino, vetarCandidato };
