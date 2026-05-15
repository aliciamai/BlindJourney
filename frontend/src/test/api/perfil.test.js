import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getPerfil, actualizarPerfil } from '../../api/perfil';

beforeEach(() => {
  localStorage.setItem('bj_token', 'test-token');
});

describe('perfil API', () => {
  it('getPerfil devuelve datos del perfil', async () => {
    const data = await getPerfil();
    expect(data.perfil).toBeDefined();
    expect(data.perfil.ciudad_origen).toBe('Madrid');
  });

  it('actualizarPerfil llama PUT /api/perfil/me', async () => {
    const data = await actualizarPerfil({ intereses: ['playa'], tipo_alojamiento: 'hostal' });
    expect(data.perfil).toBeDefined();
  });

  it('getPerfil propaga error en 500', async () => {
    server.use(http.get('/api/perfil/me', () => HttpResponse.json({ error: 'server error' }, { status: 500 })));
    await expect(getPerfil()).rejects.toThrow();
  });
});
