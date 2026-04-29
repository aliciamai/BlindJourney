// ============================================================
// BlindJourney – Normalizador de respuestas IA
// Garantiza que los datos de Gemini/Groq coincidan con el
// esquema de la BD antes de persistirlos.
// ============================================================

const TIPOS_CANDIDATO = ['cultura', 'naturaleza', 'gastronomia', 'playa', 'montana', 'ocio'];
const TIPOS_ACTIVIDAD = ['cultura', 'gastronomia', 'ocio', 'transporte', 'alojamiento', 'naturaleza'];

const truncar = (val, max) =>
  typeof val === 'string' ? val.trim().substring(0, max) : '';

const parsearNum = (val, fallback = null) => {
  const n = parseFloat(val);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
};

const parsearInt = (val, fallback = null) => {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const normalizarHora = (hora) => {
  if (typeof hora !== 'string') return '09:00';
  const limpia = hora.trim().substring(0, 5);
  return /^\d{2}:\d{2}$/.test(limpia) ? limpia : '09:00';
};

// ── Candidatos de destino ─────────────────────────────────────
const normalizarCandidatos = (lista) => {
  if (!Array.isArray(lista)) return [];

  return lista
    .map((c) => ({
      ciudad:          truncar(c.ciudad, 100) || 'Ciudad',
      pais:            truncar(c.pais, 100)   || 'País',
      tipo_viaje:      TIPOS_CANDIDATO.includes(c.tipo_viaje) ? c.tipo_viaje : 'ocio',
      precio_estimado: parsearNum(c.precio_estimado, 0),
      descripcion:     truncar(c.descripcion, 1000),
      clima:           truncar(c.clima, 100),
      idioma:          truncar(c.idioma, 50),
      duracion_vuelo:  truncar(c.duracion_vuelo, 50),
      imagen_url:      null,
      vetado:          false,
      seleccionado:    false,
    }))
    .filter((c) => c.ciudad !== 'Ciudad' || c.pais !== 'País');
};

// ── Itinerario día a día ──────────────────────────────────────
const normalizarItinerario = (lista) => {
  if (!Array.isArray(lista)) return [];

  return lista
    .filter((d) => parsearInt(d.dia) !== null)
    .map((d) => ({
      dia:    parsearInt(d.dia),
      titulo: truncar(d.titulo || `Día ${d.dia}`, 255),
      actividades: Array.isArray(d.actividades)
        ? d.actividades
            .filter((a) => a && a.nombre)
            .map((a) => ({
              hora:             normalizarHora(a.hora),
              nombre:           truncar(a.nombre, 255) || 'Actividad',
              descripcion:      truncar(a.descripcion, 2000),
              tipo:             TIPOS_ACTIVIDAD.includes(a.tipo) ? a.tipo : 'ocio',
              ubicacion:        truncar(a.ubicacion, 255),
              duracion_minutos: parsearInt(a.duracion_minutos),
              coste_estimado:   parsearNum(a.coste_estimado),
            }))
        : [],
    }));
};

module.exports = { normalizarCandidatos, normalizarItinerario };
