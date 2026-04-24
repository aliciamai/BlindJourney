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
const createApp = require('../src/create-app');

describe('Auth routes', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    app = createApp();
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
});
