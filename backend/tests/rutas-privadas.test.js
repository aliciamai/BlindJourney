const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/create-app');

describe('Rutas privadas (JWT)', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  it('protege viajes si no hay token', async () => {
    const response = await request(app).get('/api/viajes');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('NO_TOKEN');
  });

  it('permite acceder a perfil con un JWT valido', async () => {
    const token = jwt.sign(
      { usuarioId: 7, email: 'ali@example.com', nombre: 'Ali' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get('/api/perfil/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.usuario).toEqual({
      id: 7,
      email: 'ali@example.com',
      nombre: 'Ali',
    });
  });

  it('devuelve 401 con token invalido en rutas privadas', async () => {
    const response = await request(app)
      .get('/api/reservas')
      .set('Authorization', 'Bearer token-roto');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('INVALID_TOKEN');
  });

  it('devuelve 401 TOKEN_EXPIRED con token expirado', async () => {
    const expiredToken = jwt.sign(
      { usuarioId: 1, email: 'a@b.com', nombre: 'A', exp: Math.floor(Date.now() / 1000) - 100 },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get('/api/viajes')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('TOKEN_EXPIRED');
  });

  it('crea un viaje en la ruta base protegida', async () => {
    const token = jwt.sign(
      { usuarioId: 3, email: 'viajes@example.com', nombre: 'Viajera' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .post('/api/viajes')
      .set('Authorization', `Bearer ${token}`)
      .send({ destino: 'sorpresa', presupuesto: 500 });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Ruta para crear viaje preparada.');
    expect(response.body.payload).toEqual({
      destino: 'sorpresa',
      presupuesto: 500,
    });
  });
});
