jest.mock('../src/controllers/auth.controller', () => ({
  registro: (req, res) => res.status(201).json({ ok: true, route: 'registro' }),
  login: (req, res) => res.json({ ok: true, route: 'login' }),
  logout: (req, res) => res.json({ ok: true, route: 'logout' }),
  verificarEmail: (req, res) => res.json({ ok: true, token: req.params.token }),
  recuperarPassword: (req, res) => res.json({ ok: true, route: 'recuperar-password' }),
  nuevaPassword: (req, res) => res.json({ ok: true, route: 'nueva-password' }),
  refresh: (req, res) => res.json({ ok: true, route: 'refresh' }),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/create-app');

describe('BlindJourney backend routes', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  it('responde al health check', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });

  it('valida el registro cuando faltan campos', async () => {
    const response = await request(app)
      .post('/api/auth/registro')
      .send({ email: 'correo-invalido', password: '123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Datos de entrada no validos');
    expect(Array.isArray(response.body.detalles)).toBe(true);
  });

  it('permite login con payload valido usando el controlador mockeado', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: '12345678' });

    expect(response.status).toBe(200);
    expect(response.body.route).toBe('login');
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
