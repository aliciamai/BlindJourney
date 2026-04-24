const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/create-app');

describe('reservas.controller', () => {
  let app;
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    app = createApp();
    token = jwt.sign({ usuarioId: 1, email: 'a@b.com', nombre: 'A' }, 'test-secret');
  });

  it('listarReservas devuelve lista vacía', async () => {
    const res = await request(app).get('/api/reservas').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('crearReserva devuelve 201 con el payload enviado', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ hotel: 'Ritz', noches: 3 });
    expect(res.status).toBe(201);
    expect(res.body.payload).toEqual({ hotel: 'Ritz', noches: 3 });
  });

  it('cancelarReserva devuelve mensaje con el id', async () => {
    const res = await request(app).patch('/api/reservas/5/cancelar').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('5');
  });
});
