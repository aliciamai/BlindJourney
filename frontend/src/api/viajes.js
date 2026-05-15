// ============================================================
// BlindJourney – API de Viajes
// Autora: Alicia Maillo
//
// Funciones para el CRUD (Create, Read, Update, Delete) de viajes
// y operaciones específicas como revelar destino o vetar candidatos.
// Usa el cliente HTTP con autenticación (JWT en header).
// ============================================================

// Cliente HTTP configurado con JWT y manejo de refresh token
import client from './client';

// ── ENDPOINTS DE VIAJES ───────────────────────────────────────

/**
 * Obtiene la lista de todos los viajes del usuario autenticado.
 * Devuelve: [ { id, destino, fecha_inicio, estado, ... }, ... ]
 */
export const getViajes = () => client.get('/viajes').then((r) => r.data);

/**
 * Obtiene los detalles completos de un viaje específico.
 * Parámetros: id (ID del viaje)
 * Devuelve: { id, destino, estado, hogar, candidatos, itinerario, ... }
 */
export const getViaje = (id) => client.get(`/viajes/${id}`).then((r) => r.data);

/**
 * Crea un nuevo viaje.
 * Parámetros: data (objeto con fechas, presupuesto, preferencias)
 * Devuelve: { id, destino, ... } del viaje creado
 * Nota: El destino es generado por la IA y inicialmente no revelado
 */
export const crearViaje = (data) => client.post('/viajes', data).then((r) => r.data);

/**
 * Revela el destino oculto de un viaje.
 * Parámetros: id (ID del viaje)
 * Devuelve: { ..., destino (ahora visible), ciudad, pais }
 * Nota: Después de revelar, el usuario ve el itinerario generado por IA
 */
export const revelarViaje = (id) =>
  client.patch(`/viajes/${id}/revelar`).then((r) => r.data);

/**
 * Veta un destino candidato durante el wizard de creación.
 * Parámetros:
 * - viajeId: ID del viaje en creación
 * - candidatoId: ID del destino a vetar
 * - razon: motivo del veto (opcional)
 * Devuelve: lista actualizada de candidatos
 * Nota: Tras vetar todos los candidatos, se genera una nueva lista
 */
export const vetarCandidato = (viajeId, candidatoId, razon = '') =>
  client
    .patch(`/viajes/${viajeId}/candidatos/${candidatoId}/vetar`, { razon })
    .then((r) => r.data);
