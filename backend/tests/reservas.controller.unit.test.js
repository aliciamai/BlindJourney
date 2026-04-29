jest.mock('../src/models/index', () => ({
  Reserva: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Viaje:   { findOne: jest.fn() },
}));

const { Reserva, Viaje } = require('../src/models/index');
const { listarReservas, crearReserva, cancelarReserva } = require('../src/controllers/reservas.controller');

const makeReq = (opts = {}) => ({ usuario: { id: 1 }, params: {}, body: {}, query: {}, ...opts });
const makeRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };

describe('reservas – listarReservas', () => {
  it('devuelve lista con total', async () => {
    const reservas = [{ id: 1 }, { id: 2 }];
    Reserva.findAll.mockResolvedValue(reservas);
    const res = makeRes();
    await listarReservas(makeReq(), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ items: reservas, total: 2 });
  });

  it('devuelve lista vacía', async () => {
    Reserva.findAll.mockResolvedValue([]);
    const res = makeRes();
    await listarReservas(makeReq(), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ items: [], total: 0 });
  });

  it('llama next en error', async () => {
    Reserva.findAll.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await listarReservas(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('reservas – crearReserva', () => {
  it('404 si el viaje no existe o no pertenece al usuario', async () => {
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await crearReserva(makeReq({ body: { viajeId: 99 } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Viaje no encontrado' });
  });

  it('crea reserva con hotel y transporte', async () => {
    Viaje.findOne.mockResolvedValue({ id: 1 });
    const newReserva = { id: 5, estado: 'pendiente' };
    Reserva.create.mockResolvedValue(newReserva);
    const res = makeRes();
    await crearReserva(makeReq({ body: { viajeId: 1, hotel: 'Ritz', transporte: 'AVE' } }), res, jest.fn());
    expect(Reserva.create).toHaveBeenCalledWith({ viaje_id: 1, alojamiento: 'Ritz', transporte: 'AVE', estado: 'pendiente' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Reserva creada', reserva: newReserva });
  });

  it('crea reserva con alojamiento y transporte null si no se envían', async () => {
    Viaje.findOne.mockResolvedValue({ id: 1 });
    Reserva.create.mockResolvedValue({ id: 6 });
    await crearReserva(makeReq({ body: { viajeId: 1 } }), makeRes(), jest.fn());
    expect(Reserva.create).toHaveBeenCalledWith({ viaje_id: 1, alojamiento: null, transporte: null, estado: 'pendiente' });
  });

  it('llama next en error', async () => {
    Viaje.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await crearReserva(makeReq({ body: { viajeId: 1 } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('reservas – cancelarReserva', () => {
  it('404 si la reserva no existe o no pertenece al usuario', async () => {
    Reserva.findOne.mockResolvedValue(null);
    const res = makeRes();
    await cancelarReserva(makeReq({ params: { id: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Reserva no encontrada' });
  });

  it('409 si la reserva ya está cancelada', async () => {
    Reserva.findOne.mockResolvedValue({ id: 1, estado: 'cancelada' });
    const res = makeRes();
    await cancelarReserva(makeReq({ params: { id: '1' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'La reserva ya está cancelada' });
  });

  it('cancela la reserva correctamente', async () => {
    const mockReserva = { id: 1, estado: 'pendiente', update: jest.fn().mockResolvedValue({}) };
    Reserva.findOne.mockResolvedValue(mockReserva);
    const res = makeRes();
    await cancelarReserva(makeReq({ params: { id: '1' } }), res, jest.fn());
    expect(mockReserva.update).toHaveBeenCalledWith({ estado: 'cancelada' });
    expect(res.json).toHaveBeenCalledWith({ message: 'Reserva cancelada', reserva: mockReserva });
  });

  it('llama next en error', async () => {
    Reserva.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await cancelarReserva(makeReq({ params: { id: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
