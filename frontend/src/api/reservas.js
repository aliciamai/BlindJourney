// ============================================================
// BlindJourney – API de Reservas
// Autora: Alicia Maillo
//
// Funciones para gestionar reservas de viajes.
// Una reserva es la confirmación de un viaje creado.
// ============================================================

import client from './client';

// ── ENDPOINTS DE RESERVAS ────────────────────────────────────

/**
 * Obtiene todas las reservas del usuario autenticado.
 * Devuelve: [ { id, viaje_id, estado, fecha_reserva, ... }, ... ]
 */
export const getReservas = () => client.get('/reservas').then((r) => r.data);

/**
 * Crea una reserva (confirmación final) de un viaje.
 * Parámetros: data (objeto con viaje_id y otros datos de la reserva)
 * Devuelve: { id, viaje_id, estado }
 * Nota: Solo se puede reservar un viaje después de seleccionar todos los parámetros
 */
export const crearReserva = (data) =>
  client.post('/reservas', data).then((r) => r.data);

/**
 * Cancela una reserva existente.
 * Parámetros: id (ID de la reserva a cancelar)
 * Devuelve: { id, estado (ahora "cancelado") }
 * Nota: Solo se puede cancelar si el viaje no ha comenzado
 */
export const cancelarReserva = (id) =>
  client.patch(`/reservas/${id}/cancelar`).then((r) => r.data);

export const simularPago = (id) =>
  client.post(`/reservas/${id}/simular-pago`).then((r) => r.data);
