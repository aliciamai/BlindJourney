import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getReservas, crearReserva, cancelarReserva } from '../../api/reservas';

beforeEach(() => {
  localStorage.setItem('bj_token', 'test-token');
});

describe('reservas API', () => {
  it('getReservas devuelve array', async () => {
    const data = await getReservas();
    expect(Array.isArray(data)).toBe(true);
  });

  it('crearReserva llama POST /api/reservas', async () => {
    const data = await crearReserva({ viaje_id: 99 });
    expect(data.reserva.id).toBe(55);
  });

  it('cancelarReserva llama PATCH /api/reservas/:id/cancelar', async () => {
    const data = await cancelarReserva(55);
    expect(data).toBeDefined();
  });

  it('crearReserva propaga error en 500', async () => {
    server.use(http.post('/api/reservas', () => HttpResponse.json({ error: 'server error' }, { status: 500 })));
    await expect(crearReserva({ viaje_id: 99 })).rejects.toThrow();
  });
});
