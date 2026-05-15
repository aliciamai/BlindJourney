import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getItinerario, regenerarItinerario } from '../../api/itinerarios';

beforeEach(() => {
  localStorage.setItem('bj_token', 'test-token');
});

describe('itinerarios API', () => {
  it('getItinerario devuelve datos del itinerario', async () => {
    const data = await getItinerario(3);
    expect(data.itinerario).toBeDefined();
    expect(data.itinerario.destino_ciudad).toBe('París');
  });

  it('regenerarItinerario llama POST /api/itinerarios/viaje/:id/regenerar', async () => {
    const data = await regenerarItinerario(3);
    expect(data.itinerario).toBeDefined();
  });

  it('getItinerario propaga error en 500', async () => {
    server.use(http.get('/api/itinerarios/viaje/:id', () => HttpResponse.json({ error: 'server error' }, { status: 500 })));
    await expect(getItinerario(3)).rejects.toThrow();
  });
});
