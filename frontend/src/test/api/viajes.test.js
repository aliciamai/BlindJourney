import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getViajes, getViaje, crearViaje, revelarViaje, vetarCandidato } from '../../api/viajes';

beforeEach(() => {
  localStorage.setItem('bj_token', 'test-token');
});

describe('viajes API', () => {
  it('getViajes devuelve array de viajes', async () => {
    const data = await getViajes();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('getViaje devuelve un viaje por id', async () => {
    const data = await getViaje(3);
    expect(data).toBeDefined();
  });

  it('crearViaje llama POST /api/viajes', async () => {
    const data = await crearViaje({ fecha_inicio: '2026-07-01', fecha_fin: '2026-07-08', duracion: 7, presupuesto: 1200 });
    expect(data.viaje.id).toBe(99);
  });

  it('revelarViaje llama PATCH /api/viajes/:id/revelar', async () => {
    const data = await revelarViaje(1);
    expect(data.viaje.destino_revelado).toBe(true);
  });

  it('vetarCandidato llama PATCH correctamente', async () => {
    const data = await vetarCandidato(1, 10);
    expect(data).toBeDefined();
  });

  it('vetarCandidato acepta razón opcional', async () => {
    const data = await vetarCandidato(1, 10, 'no me gusta');
    expect(data).toBeDefined();
  });

  it('getViajes propaga error en 500', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json({ error: 'server error' }, { status: 500 })));
    await expect(getViajes()).rejects.toThrow();
  });
});
