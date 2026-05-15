import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { loginApi, registroApi, logoutApi, refreshTokenApi, recuperarPasswordApi, nuevaPasswordApi } from '../../api/auth';

describe('auth API', () => {
  it('loginApi llama POST /api/auth/login y devuelve datos', async () => {
    const data = await loginApi('ana@test.com', 'Password1');
    expect(data.token).toBe('test-access-token-abc123');
    expect(data.usuario.email).toBe('ana@test.com');
  });

  it('loginApi propaga error en caso de respuesta 401', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ mensaje: 'Credenciales incorrectas' }, { status: 401 })));
    await expect(loginApi('x@x.com', 'wrong')).rejects.toThrow();
  });

  it('registroApi llama POST /api/auth/registro', async () => {
    const data = await registroApi({ nombre: 'Ana', apellidos: 'García', email: 'ana@test.com', password: 'Password1' });
    expect(data).toBeDefined();
  });

  it('logoutApi llama POST /api/auth/logout', async () => {
    const data = await logoutApi('some-refresh-token');
    expect(data).toBeDefined();
  });

  it('refreshTokenApi llama POST /api/auth/refresh', async () => {
    const data = await refreshTokenApi('some-refresh');
    expect(data.token).toBeDefined();
  });

  it('recuperarPasswordApi llama POST /api/auth/recuperar-password', async () => {
    const data = await recuperarPasswordApi('ana@test.com');
    expect(data).toBeDefined();
  });

  it('nuevaPasswordApi llama POST /api/auth/nueva-password', async () => {
    const data = await nuevaPasswordApi('reset-token', 'NewPass1');
    expect(data).toBeDefined();
  });
});
