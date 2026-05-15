// ============================================================
// BlindJourney – API de Buscador (vuelos, hoteles, experiencias)
// Autora: Alicia Maillo
//
// Funciones para el buscador integrado que genera links a plataformas
// externas (Skyscanner, Booking, etc.) y registra las búsquedas del usuario.
// ============================================================

import client from './client';

// ── ENDPOINTS DE BUSCADOR ────────────────────────────────────

/**
 * Registra una búsqueda del usuario en el backend.
 * Parámetros: data (objeto con destino, fechas, tipo de búsqueda, proveedor)
 * Devuelve: { id, usuario_id, fecha, ... }
 * Nota: Usado para análisis y estadísticas de búsquedas
 */
export const registrarBusqueda = (data) =>
  client.post('/buscador/registrar', data).then(r => r.data);

/**
 * Obtiene estadísticas de búsquedas del usuario.
 * Devuelve: { total_busquedas, busquedas_por_tipo, destinos_populares, ... }
 * Nota: Se muestra en BuscadorPage para dar contexto de búsquedas anteriores
 */
export const getEstadisticas = () =>
  client.get('/buscador/estadisticas').then(r => r.data);

/**
 * Genera links de búsqueda para proveedores externos.
 * Parámetros: params (objeto con destino, fechas, tipo: vuelos/hoteles/experiencias)
 * Devuelve: { links: [ { proveedor, url }, ... ] }
 * Nota: No se usa actualmente en BuscadorPage (genera links en cliente).
 *       Está disponible para futuras features si se necesita backend para generar links.
 */
export const getLinks = (params) =>
  client.get('/buscador/links', { params }).then(r => r.data);
