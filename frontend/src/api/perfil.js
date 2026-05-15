// ============================================================
// BlindJourney – API de Perfil de Usuario
// Autora: Alicia Maillo
//
// Funciones para obtener y actualizar el perfil del usuario autenticado.
// El perfil guarda preferencias de viaje (intereses, alojamiento, dieta, etc.)
// ============================================================

import client from './client';

// ── ENDPOINTS DE PERFIL ──────────────────────────────────────

/**
 * Obtiene el perfil completo del usuario autenticado.
 * Endpoint: GET /api/perfil/me (el 'me' significa "mi perfil")
 * Devuelve: { id, nombre, email, ciudad, intereses, alojamiento, dieta, ... }
 */
export const getPerfil = () => client.get('/perfil/me').then((r) => r.data);

/**
 * Actualiza el perfil del usuario autenticado.
 * Parámetros: data (objeto con los campos a actualizar)
 * Devuelve: { id, nombre, email, ciudad, intereses, ... } (perfil actualizado)
 * Nota: Solo actualiza los campos especificados en data, el resto permanecen igual
 */
export const actualizarPerfil = (data) =>
  client.put('/perfil/me', data).then((r) => r.data);
