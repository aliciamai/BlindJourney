const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/create-app');

describe('viajes.controller', () => {
  let app;
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    app = createApp();
    token = jwt.sign({ usuarioId: 1, email: 'a@b.com', nombre: 'A' }, 'test-secret');
  });

  it('listarViajes devuelve lista vacía', async () => {
    const res = await request(app).get('/api/viajes').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('obtenerViajePorId devuelve el id numérico', async () => {
    const res = await request(app).get('/api/viajes/42').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(42);
  });

  it('revelarDestino devuelve mensaje con el id del viaje', async () => {
    const res = await request(app).patch('/api/viajes/7/revelar').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('7');
  });
});
