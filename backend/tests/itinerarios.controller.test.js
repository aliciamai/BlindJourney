const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/create-app');

describe('itinerarios.controller', () => {
  let app;
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    app = createApp();
    token = jwt.sign({ usuarioId: 1, email: 'a@b.com', nombre: 'A' }, 'test-secret');
  });

  it('obtenerItinerarioDeViaje devuelve el viajeId y dias vacíos', async () => {
    const res = await request(app).get('/api/itinerarios/viaje/12').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.viajeId).toBe(12);
    expect(res.body.dias).toEqual([]);
  });

  it('regenerarItinerario devuelve el viajeId', async () => {
    const res = await request(app).post('/api/itinerarios/viaje/12/regenerar').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.viajeId).toBe(12);
  });
});
