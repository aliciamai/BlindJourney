import { http, HttpResponse } from 'msw';
import { userFixture, tokenFixture, refreshTokenFixture } from '../fixtures/user';
import { viajesFixture, viajeReveladoFixture } from '../fixtures/viajes';
import { itinerarioFixture } from '../fixtures/itinerario';
import { fotosFixture } from '../fixtures/fotos';
import { documentosFixture } from '../fixtures/documentos';
import { perfilFixture } from '../fixtures/perfil';

export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────
  http.post('/api/auth/login', () =>
    HttpResponse.json({ token: tokenFixture, refreshToken: refreshTokenFixture, usuario: userFixture })
  ),
  http.post('/api/auth/registro', () => HttpResponse.json({ message: 'ok' }, { status: 201 })),
  http.post('/api/auth/logout', () => HttpResponse.json({ message: 'ok' })),
  http.post('/api/auth/refresh', () =>
    HttpResponse.json({ token: 'new-access-token' })
  ),
  http.post('/api/auth/recuperar-password', () => HttpResponse.json({ message: 'ok' })),
  http.post('/api/auth/nueva-password', () => HttpResponse.json({ message: 'ok' })),

  // ── Viajes ─────────────────────────────────────────────────────
  http.get('/api/viajes', () => HttpResponse.json(viajesFixture)),
  http.get('/api/viajes/:id', ({ params }) => {
    const viaje = viajesFixture.find((v) => v.id === Number(params.id)) || viajesFixture[0];
    return HttpResponse.json({ viaje });
  }),
  http.post('/api/viajes', () =>
    HttpResponse.json({ viaje: { id: 99, estado: 'pendiente', candidatos: [{ id: 201, ciudad: 'Berlín', pais: 'Alemania', tipo_viaje: 'urbano', precio_estimado: 900, vetado: false, seleccionado: false }] } })
  ),
  http.patch('/api/viajes/:id/revelar', ({ params }) => {
    const viaje = viajesFixture.find((v) => v.id === Number(params.id)) || viajesFixture[0];
    return HttpResponse.json({ viaje: { ...viaje, destino_revelado: true, destino_ciudad: 'Lisboa', destino_pais: 'Portugal', estado: 'revelado' } });
  }),
  http.patch('/api/viajes/:viajeId/candidatos/:cId/vetar', () =>
    HttpResponse.json({ message: 'vetado' })
  ),

  // ── Reservas ───────────────────────────────────────────────────
  http.get('/api/reservas', () => HttpResponse.json([])),
  http.post('/api/reservas', () =>
    HttpResponse.json({ reserva: { id: 55, viaje_id: 99, estado: 'pendiente' } })
  ),
  http.post('/api/reservas/:id/simular-pago', () =>
    HttpResponse.json({ message: 'ok' })
  ),
  http.patch('/api/reservas/:id/cancelar', () => HttpResponse.json({ message: 'ok' })),

  // ── Perfil ──────────────────────────────────────────────────────
  http.get('/api/perfil/me', () => HttpResponse.json({ perfil: perfilFixture })),
  http.put('/api/perfil/me', () => HttpResponse.json({ perfil: perfilFixture })),

  // ── Itinerarios ─────────────────────────────────────────────────
  http.get('/api/itinerarios/viaje/:id', () =>
    HttpResponse.json({ itinerario: itinerarioFixture })
  ),
  http.post('/api/itinerarios/viaje/:id/regenerar', () =>
    HttpResponse.json({ itinerario: itinerarioFixture })
  ),

  // ── Actividades (usadas por ItinerarioPage directamente) ────────
  http.patch('/api/itinerarios/actividades/:id', () => HttpResponse.json({ message: 'ok' })),
  http.delete('/api/itinerarios/actividades/:id', () => HttpResponse.json({ message: 'ok' })),

  // ── Fotos ───────────────────────────────────────────────────────
  http.get('/api/fotos/viaje/:id', () => HttpResponse.json(fotosFixture)),
  http.post('/api/fotos/viaje/:id', () =>
    HttpResponse.json({ id: 99, url: 'data:image/png;base64,abc', descripcion: null, ubicacion_nombre: null })
  ),
  http.delete('/api/fotos/:id', () => HttpResponse.json({ message: 'ok' })),

  // ── Buscador ────────────────────────────────────────────────────
  http.post('/api/buscador/registrar', () => HttpResponse.json({ message: 'ok' })),
  http.get('/api/buscador/estadisticas', () =>
    HttpResponse.json({ stats: { total: 5, vuelos: 2, hoteles: 2, experiencias: 1 } })
  ),
  http.get('/api/buscador/links', () => HttpResponse.json({ links: {} })),

  // ── Documentos ──────────────────────────────────────────────────
  http.get('/api/documentos', () => HttpResponse.json(documentosFixture)),
];
