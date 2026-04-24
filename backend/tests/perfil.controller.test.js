const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/create-app');

describe('perfil.controller – actualizarPerfil', () => {
  let app;
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    app = createApp();
    token = jwt.sign({ usuarioId: 1, email: 'a@b.com', nombre: 'A' }, 'test-secret');
  });

  it('devuelve los cambios enviados', async () => {
    const res = await request(app)
      .put('/api/perfil/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Nuevo nombre' });
    expect(res.status).toBe(200);
    expect(res.body.cambios).toEqual({ nombre: 'Nuevo nombre' });
  });
});
