jest.mock('../src/models/usuario.model');
jest.mock('../src/services/email.service', () => ({
  enviarVerificacion: jest.fn().mockResolvedValue(true),
  enviarRecuperacion: jest.fn().mockResolvedValue(true),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../src/models/usuario.model');
const authController = require('../src/controllers/auth.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn();
  return res;
};

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.FRONTEND_URL = 'http://localhost:3000';
});

beforeEach(() => jest.clearAllMocks());

describe('registro', () => {
  it('devuelve 409 si el email ya existe', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue({ id: 1 });
    const res = mockRes();
    await authController.registro({ body: { nombre: 'Ali', apellidos: 'M', email: 'ali@t.com', password: 'pass1234' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('crea usuario y devuelve 201', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue(null);
    UsuarioModel.crear.mockResolvedValue({ id: 5 });
    const res = mockRes();
    await authController.registro({ body: { nombre: 'Ali', apellidos: 'M', email: 'ali@t.com', password: 'pass1234' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 5 }));
  });

  it('llama a next con error si la BD falla', async () => {
    UsuarioModel.buscarPorEmail.mockRejectedValue(new Error('DB error'));
    const next = jest.fn();
    await authController.registro({ body: { nombre: 'Ali', apellidos: 'M', email: 'ali@t.com', password: 'pass1234' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('login', () => {
  it('devuelve 401 si el usuario no existe', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue(null);
    const res = mockRes();
    await authController.login({ body: { email: 'x@x.com', password: '12345678' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devuelve 401 si la password es incorrecta', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue({ id: 1, password_hash: '$hash', email_verificado: true });
    bcrypt.compare.mockResolvedValue(false);
    const res = mockRes();
    await authController.login({ body: { email: 'x@x.com', password: 'wrongpass' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devuelve 403 si el email no está verificado', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue({ id: 1, password_hash: '$hash', email_verificado: false });
    bcrypt.compare.mockResolvedValue(true);
    const res = mockRes();
    await authController.login({ body: { email: 'x@x.com', password: '12345678' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'EMAIL_NOT_VERIFIED' }));
  });

  it('devuelve token y refreshToken en login exitoso', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue({ id: 1, email: 'x@x.com', nombre: 'X', apellidos: 'Y', idioma: 'es', password_hash: '$hash', email_verificado: true });
    bcrypt.compare.mockResolvedValue(true);
    UsuarioModel.guardarRefreshToken.mockResolvedValue();
    const res = mockRes();
    await authController.login({ body: { email: 'x@x.com', password: '12345678' } }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String), refreshToken: expect.any(String) }));
  });

  it('llama a next con error si la BD falla', async () => {
    UsuarioModel.buscarPorEmail.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await authController.login({ body: { email: 'x@x.com', password: '12345678' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('logout', () => {
  it('cierra sesión con refreshToken', async () => {
    UsuarioModel.eliminarRefreshToken.mockResolvedValue();
    const res = mockRes();
    await authController.logout({ body: { refreshToken: 'tok' } }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ message: 'Sesión cerrada correctamente' });
  });

  it('cierra sesión sin refreshToken', async () => {
    const res = mockRes();
    await authController.logout({ body: {} }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ message: 'Sesión cerrada correctamente' });
  });

  it('llama a next con error si la BD falla', async () => {
    UsuarioModel.eliminarRefreshToken.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await authController.logout({ body: { refreshToken: 'tok' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('verificarEmail', () => {
  it('devuelve 400 si el token no existe', async () => {
    UsuarioModel.buscarPorTokenVerificacion.mockResolvedValue(null);
    const res = mockRes();
    await authController.verificarEmail({ params: { token: 'invalid' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('redirige si el token es válido', async () => {
    UsuarioModel.buscarPorTokenVerificacion.mockResolvedValue({ id: 1 });
    UsuarioModel.verificarEmail.mockResolvedValue();
    const res = mockRes();
    await authController.verificarEmail({ params: { token: 'valid' } }, res, jest.fn());
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?verified=true');
  });

  it('llama a next con error si la BD falla', async () => {
    UsuarioModel.buscarPorTokenVerificacion.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await authController.verificarEmail({ params: { token: 'tok' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('registro – callback .catch del email', () => {
  it('cubre el callback de error del email si enviarVerificacion rechaza', async () => {
    const emailService = require('../src/services/email.service');
    emailService.enviarVerificacion.mockRejectedValueOnce(new Error('SMTP error'));
    UsuarioModel.buscarPorEmail.mockResolvedValue(null);
    UsuarioModel.crear.mockResolvedValue({ id: 9 });
    const res = mockRes();
    await authController.registro({ body: { nombre: 'Ali', apellidos: 'M', email: 'ali@t.com', password: 'pass1234' } }, res, jest.fn());
    await new Promise(r => setImmediate(r));
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('recuperarPassword', () => {
  it('responde con mensaje genérico si el email no existe', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue(null);
    const res = mockRes();
    await authController.recuperarPassword({ body: { email: 'no@x.com' } }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  it('genera token y responde con mensaje genérico si el usuario existe', async () => {
    UsuarioModel.buscarPorEmail.mockResolvedValue({ id: 2, nombre: 'Ali', email: 'ali@x.com' });
    UsuarioModel.guardarTokenReset.mockResolvedValue();
    const res = mockRes();
    await authController.recuperarPassword({ body: { email: 'ali@x.com' } }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  it('cubre el callback de error del email si enviarRecuperacion rechaza', async () => {
    const emailService = require('../src/services/email.service');
    emailService.enviarRecuperacion.mockRejectedValueOnce(new Error('SMTP error'));
    UsuarioModel.buscarPorEmail.mockResolvedValue({ id: 2, nombre: 'Ali', email: 'ali@x.com' });
    UsuarioModel.guardarTokenReset.mockResolvedValue();
    const res = mockRes();
    await authController.recuperarPassword({ body: { email: 'ali@x.com' } }, res, jest.fn());
    await new Promise(r => setImmediate(r));
    expect(res.json).toHaveBeenCalled();
  });

  it('llama a next con error si la BD falla', async () => {
    UsuarioModel.buscarPorEmail.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await authController.recuperarPassword({ body: { email: 'ali@x.com' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('nuevaPassword', () => {
  it('devuelve 400 si el token es inválido', async () => {
    UsuarioModel.buscarPorTokenReset.mockResolvedValue(null);
    const res = mockRes();
    await authController.nuevaPassword({ body: { token: 'bad', nuevaPassword: 'nueva1234' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('actualiza la password con token válido', async () => {
    UsuarioModel.buscarPorTokenReset.mockResolvedValue({ id: 3 });
    UsuarioModel.actualizarPassword.mockResolvedValue();
    const res = mockRes();
    await authController.nuevaPassword({ body: { token: 'valid', nuevaPassword: 'nueva1234' } }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña actualizada correctamente' });
  });

  it('llama a next con error si la BD falla', async () => {
    UsuarioModel.buscarPorTokenReset.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await authController.nuevaPassword({ body: { token: 'tok', nuevaPassword: 'pass' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('refresh', () => {
  it('devuelve 401 si no se envía refreshToken', async () => {
    const res = mockRes();
    await authController.refresh({ body: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devuelve 401 si el refreshToken es inválido', async () => {
    const res = mockRes();
    await authController.refresh({ body: { refreshToken: 'token-invalido' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devuelve 401 si el refreshToken fue revocado', async () => {
    const refreshToken = jwt.sign({ usuarioId: 9, tipo: 'refresh' }, 'test-secret');
    UsuarioModel.verificarRefreshToken.mockResolvedValue(false);
    const res = mockRes();
    await authController.refresh({ body: { refreshToken } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devuelve nuevo token si el refreshToken es válido', async () => {
    const refreshToken = jwt.sign({ usuarioId: 9, tipo: 'refresh' }, 'test-secret');
    UsuarioModel.verificarRefreshToken.mockResolvedValue(true);
    UsuarioModel.buscarPorId.mockResolvedValue({ id: 9, email: 'a@b.com', nombre: 'A' });
    const res = mockRes();
    await authController.refresh({ body: { refreshToken } }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
  });

  it('llama a next con error si la BD falla', async () => {
    const refreshToken = jwt.sign({ usuarioId: 9, tipo: 'refresh' }, 'test-secret');
    UsuarioModel.verificarRefreshToken.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await authController.refresh({ body: { refreshToken } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
