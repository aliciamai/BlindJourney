import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { registrarBusqueda, getEstadisticas, getLinks } from '../../api/buscador';

beforeEach(() => {
  localStorage.setItem('bj_token', 'test-token');
});

describe('buscador API', () => {
  it('registrarBusqueda llama POST /api/buscador/registrar', async () => {
    const data = await registrarBusqueda({ tipo: 'vuelo', proveedor: 'Skyscanner', destino_ciudad: 'París', url_destino: 'https://skyscanner.es' });
    expect(data).toBeDefined();
  });

  it('getEstadisticas devuelve stats', async () => {
    const data = await getEstadisticas();
    expect(data.stats.total).toBe(5);
  });

  it('getLinks llama GET /api/buscador/links', async () => {
    const data = await getLinks({ destino: 'París' });
    expect(data).toBeDefined();
  });

  it('getEstadisticas propaga error en 500', async () => {
    server.use(http.get('/api/buscador/estadisticas', () => HttpResponse.json({ error: 'server error' }, { status: 500 })));
    await expect(getEstadisticas()).rejects.toThrow();
  });
});
