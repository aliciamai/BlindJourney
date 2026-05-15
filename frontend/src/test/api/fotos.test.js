import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getFotos, subirFoto, eliminarFoto } from '../../api/fotos';

beforeEach(() => {
  localStorage.setItem('bj_token', 'test-token');
});

describe('fotos API', () => {
  it('getFotos devuelve array de fotos', async () => {
    const data = await getFotos(1);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
  });

  it('subirFoto llama POST /api/fotos/viaje/:id', async () => {
    const data = await subirFoto(1, { url: 'data:img', descripcion: 'Test', ubicacion_nombre: 'París', fecha_foto: new Date().toISOString() });
    expect(data.id).toBeDefined();
  });

  it('eliminarFoto llama DELETE /api/fotos/:id', async () => {
    const data = await eliminarFoto(1);
    expect(data).toBeDefined();
  });

  it('getFotos propaga error en 500', async () => {
    server.use(http.get('/api/fotos/viaje/:id', () => HttpResponse.json({ error: 'server error' }, { status: 500 })));
    await expect(getFotos(1)).rejects.toThrow();
  });
});
