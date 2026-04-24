const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middlewares/auth.middleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

describe('auth.middleware', () => {
  it('devuelve 401 NO_TOKEN si no hay cabecera Authorization', () => {
    const req = { headers: {} };
    const res = mockRes();
    authMiddleware(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NO_TOKEN' }));
  });

  it('devuelve 401 NO_TOKEN si la cabecera no empieza por Bearer', () => {
    const req = { headers: { authorization: 'Basic abc' } };
    const res = mockRes();
    authMiddleware(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NO_TOKEN' }));
  });

  it('devuelve 401 INVALID_TOKEN con token manipulado', () => {
    const req = { headers: { authorization: 'Bearer token-roto' } };
    const res = mockRes();
    authMiddleware(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_TOKEN' }));
  });

  it('devuelve 401 TOKEN_EXPIRED con token expirado', () => {
    const expired = jwt.sign(
      { usuarioId: 1, email: 'a@b.com', nombre: 'A', exp: Math.floor(Date.now() / 1000) - 100 },
      'test-secret'
    );
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const res = mockRes();
    authMiddleware(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_EXPIRED' }));
  });

  it('llama a next y popula req.usuario con token válido', () => {
    const token = jwt.sign({ usuarioId: 7, email: 'ali@b.com', nombre: 'Ali' }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.usuario).toEqual({ id: 7, email: 'ali@b.com', nombre: 'Ali' });
  });
});
