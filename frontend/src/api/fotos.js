// ============================================================
// BlindJourney – API de Fotos de Viaje
// Autora: Alicia Maillo
//
// Funciones para gestionar fotos del álbum de un viaje.
// Los usuarios pueden subir fotos, verlas en un álbum, y eliminarlas.
// ============================================================

import client from './client';

// ── ENDPOINTS DE FOTOS ───────────────────────────────────────

/**
 * Obtiene todas las fotos de un viaje específico.
 * Parámetros: viajeId (ID del viaje)
 * Devuelve: [ { id, viaje_id, url, descripcion, ubicacion, ... }, ... ]
 */
export const getFotos = (viajeId) =>
  client.get(`/fotos/viaje/${viajeId}`).then(r => r.data);

/**
 * Sube una nueva foto a un viaje.
 * Parámetros:
 * - viajeId: ID del viaje
 * - data: FormData con archivo de imagen, descripción, ubicación
 * Devuelve: { id, viaje_id, url, descripcion, ubicacion }
 * Nota: El servidor almacena la imagen en cloud storage (ej. AWS S3)
 */
export const subirFoto = (viajeId, data) =>
  client.post(`/fotos/viaje/${viajeId}`, data).then(r => r.data);

/**
 * Elimina una foto específica.
 * Parámetros: fotoId (ID de la foto a eliminar)
 * Devuelve: { success: true } o error
 * Nota: También borra la imagen del cloud storage
 */
export const eliminarFoto = (fotoId) =>
  client.delete(`/fotos/${fotoId}`).then(r => r.data);
