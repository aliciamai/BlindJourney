jest.mock('../src/controllers/viajes.controller', () => ({
  listarViajes: (req, res, next) => next(Object.assign(new Error('Error controlado'), { statusCode: 422 })),
  obtenerViajePorId: (req, res, next) => { const e = new Error(''); delete e.message; next(e); },
  crearViaje: (req, res) => res.status(201).json({}),
  revelarDestino: (req, res) => res.json({}),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/create-app');

describe('create-app – error handler', () => {
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    token = jwt.sign({ usuarioId: 1, email: 'a@b.com', nombre: 'A' }, 'test-secret');
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('devuelve el statusCode del error y stack en modo development', async () => {
    process.env.NODE_ENV = 'development';
    const app = createApp();
    const res = await request(app).get('/api/viajes').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Error controlado');
    expect(res.body.stack).toBeDefined();
  });

  it('no incluye stack en modo production', async () => {
    process.env.NODE_ENV = 'production';
    const app = createApp();
    const res = await request(app).get('/api/viajes').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
    expect(res.body.stack).toBeUndefined();
  });

  it('usa 500 por defecto y mensaje genérico cuando el error no tiene statusCode ni message', async () => {
    process.env.NODE_ENV = 'test';
    const app = createApp();
    const res = await request(app).get('/api/viajes/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });
});
