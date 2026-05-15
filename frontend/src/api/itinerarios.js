// ============================================================
// BlindJourney – API de Itinerarios (generados por IA)
// Autora: Alicia Maillo
//
// Funciones para obtener y regenerar itinerarios.
// Un itinerario es el plan de actividades diarias generado por IA
// para un viaje una vez que se ha revelado el destino.
// ============================================================

import client from './client';

// ── ENDPOINTS DE ITINERARIOS ────────────────────────────────

/**
 * Obtiene el itinerario de un viaje específico.
 * Parámetros: viajeId (ID del viaje)
 * Devuelve: { id, viaje_id, actividades: [ { id, dia, hora, titulo, ... }, ... ] }
 * Nota: Solo disponible después de revelar el destino
 */
export const getItinerario = (viajeId) =>
  client.get(`/itinerarios/viaje/${viajeId}`).then((r) => r.data);

/**
 * Regenera el itinerario de un viaje usando IA.
 * Parámetros: viajeId (ID del viaje)
 * Devuelve: { id, viaje_id, actividades (nuevas) }
 * Nota: Útil si al usuario no le gusta el itinerario generado inicialmente
 */
export const regenerarItinerario = (viajeId) =>
  client.post(`/itinerarios/viaje/${viajeId}/regenerar`).then((r) => r.data);
