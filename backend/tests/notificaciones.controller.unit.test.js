jest.mock('../src/models/index', () => ({
  Notificacion: {
    findAndCountAll: jest.fn(),
    findOne:         jest.fn(),
    update:          jest.fn(),
    destroy:         jest.fn(),
  },
}));

const { Notificacion } = require('../src/models/index');
const {
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
} = require('../src/controllers/notificaciones.controller');

const makeReq = (opts = {}) => ({ usuario: { id: 1 }, params: {}, body: {}, query: {}, ...opts });
const makeRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };

describe('notificaciones – listarNotificaciones', () => {
  it('devuelve listado paginado con valores por defecto', async () => {
    Notificacion.findAndCountAll.mockResolvedValue({ count: 2, rows: [{ id: 1 }, { id: 2 }] });
    const res = makeRes();
    await listarNotificaciones(makeReq(), res, jest.fn());
    expect(Notificacion.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 20, offset: 0 }));
    expect(res.json).toHaveBeenCalledWith({ items: [{ id: 1 }, { id: 2 }], total: 2, pagina: 1, paginas: 1 });
  });

  it('respeta pagina y limite pasados por query', async () => {
    Notificacion.findAndCountAll.mockResolvedValue({ count: 100, rows: [] });
    const res = makeRes();
    await listarNotificaciones(makeReq({ query: { pagina: '3', limite: '10' } }), res, jest.fn());
    expect(Notificacion.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 20 }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pagina: 3, paginas: 10 }));
  });

  it('filtra solo no leídas cuando solo_no_leidas=true', async () => {
    Notificacion.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 3, leida: false }] });
    const res = makeRes();
    await listarNotificaciones(makeReq({ query: { solo_no_leidas: 'true' } }), res, jest.fn());
    const where = Notificacion.findAndCountAll.mock.calls[0][0].where;
    expect(where.leida).toBe(false);
  });

  it('limite máximo es 50 aunque se pida más', async () => {
    Notificacion.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listarNotificaciones(makeReq({ query: { limite: '200' } }), makeRes(), jest.fn());
    expect(Notificacion.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
  });

  it('pagina mínima es 1 aunque se pase 0 o negativo', async () => {
    Notificacion.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await listarNotificaciones(makeReq({ query: { pagina: '-5' } }), makeRes(), jest.fn());
    expect(Notificacion.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
  });

  it('llama next en error', async () => {
    Notificacion.findAndCountAll.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await listarNotificaciones(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('notificaciones – marcarLeida', () => {
  it('404 si la notificación no existe', async () => {
    Notificacion.findOne.mockResolvedValue(null);
    const res = makeRes();
    await marcarLeida(makeReq({ params: { id: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Notificación no encontrada' });
  });

  it('marca como leída y devuelve la notificación', async () => {
    const mockNot = { id: 1, update: jest.fn().mockResolvedValue({}) };
    Notificacion.findOne.mockResolvedValue(mockNot);
    const res = makeRes();
    await marcarLeida(makeReq({ params: { id: '1' } }), res, jest.fn());
    expect(mockNot.update).toHaveBeenCalledWith({ leida: true });
    expect(res.json).toHaveBeenCalledWith({ notificacion: mockNot });
  });

  it('llama next en error', async () => {
    Notificacion.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await marcarLeida(makeReq({ params: { id: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('notificaciones – marcarTodasLeidas', () => {
  it('actualiza todas las no leídas del usuario', async () => {
    Notificacion.update.mockResolvedValue([5]);
    const res = makeRes();
    await marcarTodasLeidas(makeReq(), res, jest.fn());
    expect(Notificacion.update).toHaveBeenCalledWith({ leida: true }, { where: { usuario_id: 1, leida: false } });
    expect(res.json).toHaveBeenCalledWith({ message: '5 notificaciones marcadas como leídas' });
  });

  it('devuelve 0 si no había no leídas', async () => {
    Notificacion.update.mockResolvedValue([0]);
    const res = makeRes();
    await marcarTodasLeidas(makeReq(), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ message: '0 notificaciones marcadas como leídas' });
  });

  it('llama next en error', async () => {
    Notificacion.update.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await marcarTodasLeidas(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('notificaciones – eliminarNotificacion', () => {
  it('404 si no existe la notificación', async () => {
    Notificacion.destroy.mockResolvedValue(0);
    const res = makeRes();
    await eliminarNotificacion(makeReq({ params: { id: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Notificación no encontrada' });
  });

  it('elimina y devuelve confirmación', async () => {
    Notificacion.destroy.mockResolvedValue(1);
    const res = makeRes();
    await eliminarNotificacion(makeReq({ params: { id: '1' } }), res, jest.fn());
    expect(Notificacion.destroy).toHaveBeenCalledWith({ where: { id: '1', usuario_id: 1 } });
    expect(res.json).toHaveBeenCalledWith({ message: 'Notificación eliminada' });
  });

  it('llama next en error', async () => {
    Notificacion.destroy.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await eliminarNotificacion(makeReq({ params: { id: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
