jest.mock('../src/models/index', () => ({
  Comision: { create: jest.fn(), findAll: jest.fn() },
}));

const { Comision } = require('../src/models/index');
const { registrar, estadisticas, generarLinks } = require('../src/controllers/buscador.controller');

const makeReq = (opts = {}) => ({ usuario: { id: 1 }, params: {}, body: {}, query: {}, ...opts });
const makeRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };

describe('buscador – registrar', () => {
  it('400 si falta tipo', async () => {
    const res = makeRes();
    await registrar(makeReq({ body: { destino_ciudad: 'Madrid' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'tipo y destino_ciudad son requeridos' });
  });

  it('400 si falta destino_ciudad', async () => {
    const res = makeRes();
    await registrar(makeReq({ body: { tipo: 'vuelo' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('201 con todos los campos', async () => {
    Comision.create.mockResolvedValue({});
    const res = makeRes();
    await registrar(makeReq({ body: { tipo: 'vuelo', destino_ciudad: 'París', proveedor: 'kayak', url_destino: 'http://x.com', viaje_id: 2 } }), res, jest.fn());
    expect(Comision.create).toHaveBeenCalledWith(expect.objectContaining({ usuario_id: 1, tipo: 'vuelo', proveedor: 'kayak', viaje_id: 2 }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Búsqueda registrada' });
  });

  it('usa "desconocido" si no hay proveedor', async () => {
    Comision.create.mockResolvedValue({});
    await registrar(makeReq({ body: { tipo: 'hotel', destino_ciudad: 'Roma' } }), makeRes(), jest.fn());
    expect(Comision.create).toHaveBeenCalledWith(expect.objectContaining({ proveedor: 'desconocido' }));
  });

  it('viaje_id es null si no se envía', async () => {
    Comision.create.mockResolvedValue({});
    await registrar(makeReq({ body: { tipo: 'hotel', destino_ciudad: 'Roma' } }), makeRes(), jest.fn());
    expect(Comision.create).toHaveBeenCalledWith(expect.objectContaining({ viaje_id: null }));
  });

  it('trunca destino_ciudad a 100 caracteres', async () => {
    Comision.create.mockResolvedValue({});
    await registrar(makeReq({ body: { tipo: 'vuelo', destino_ciudad: 'A'.repeat(200) } }), makeRes(), jest.fn());
    const { destino_ciudad } = Comision.create.mock.calls[0][0];
    expect(destino_ciudad.length).toBe(100);
  });

  it('llama next en error de BD', async () => {
    Comision.create.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await registrar(makeReq({ body: { tipo: 'vuelo', destino_ciudad: 'X' } }), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('buscador – estadisticas', () => {
  it('devuelve stats agrupadas', async () => {
    const historial = [{ tipo: 'vuelo' }, { tipo: 'vuelo' }, { tipo: 'hotel' }, { tipo: 'experiencia' }];
    Comision.findAll.mockResolvedValue(historial);
    const res = makeRes();
    await estadisticas(makeReq(), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({
      stats: { total: 4, vuelos: 2, hoteles: 1, experiencias: 1 },
      historial,
    });
  });

  it('devuelve stats vacías sin historial', async () => {
    Comision.findAll.mockResolvedValue([]);
    const res = makeRes();
    await estadisticas(makeReq(), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ stats: { total: 0, vuelos: 0, hoteles: 0, experiencias: 0 }, historial: [] });
  });

  it('llama next en error', async () => {
    Comision.findAll.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await estadisticas(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('buscador – generarLinks', () => {
  it('400 si falta tipo', async () => {
    const res = makeRes();
    await generarLinks(makeReq({ query: { destino: 'París' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'tipo y destino son requeridos' });
  });

  it('400 si falta destino', async () => {
    const res = makeRes();
    await generarLinks(makeReq({ query: { tipo: 'vuelo' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('devuelve links de vuelo con fechas', async () => {
    const res = makeRes();
    await generarLinks(makeReq({ query: { tipo: 'vuelo', destino: 'París', fecha_ida: '2025-06-01', fecha_vuelta: '2025-06-08', adultos: '2' } }), res, jest.fn());
    const { links } = res.json.mock.calls[0][0];
    expect(links.skyscanner).toContain('skyscanner');
    expect(links.googleFlights).toContain('google.com');
    expect(links.kayak).toContain('kayak');
  });

  it('devuelve links de vuelo sin fechas', async () => {
    const res = makeRes();
    await generarLinks(makeReq({ query: { tipo: 'vuelo', destino: 'Roma' } }), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ links: expect.objectContaining({ skyscanner: expect.any(String) }) }));
  });

  it('devuelve links de hotel con fechas', async () => {
    const res = makeRes();
    await generarLinks(makeReq({ query: { tipo: 'hotel', destino: 'Roma', checkin: '2025-06-01', checkout: '2025-06-05', adultos: '2' } }), res, jest.fn());
    const { links } = res.json.mock.calls[0][0];
    expect(links.booking).toContain('booking.com');
    expect(links.airbnb).toContain('airbnb');
  });

  it('devuelve links de hotel sin fechas', async () => {
    const res = makeRes();
    await generarLinks(makeReq({ query: { tipo: 'hotel', destino: 'Berlín' } }), res, jest.fn());
    expect(res.json).toHaveBeenCalled();
  });

  it('devuelve links de experiencia', async () => {
    const res = makeRes();
    await generarLinks(makeReq({ query: { tipo: 'experiencia', destino: 'Berlín' } }), res, jest.fn());
    const { links } = res.json.mock.calls[0][0];
    expect(links.viator).toContain('viator');
    expect(links.getyourguide).toContain('getyourguide');
  });

  it('400 para tipo desconocido', async () => {
    const res = makeRes();
    await generarLinks(makeReq({ query: { tipo: 'tren', destino: 'X' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'tipo debe ser vuelo, hotel o experiencia' });
  });

  it('llama next si query es null', async () => {
    const next = jest.fn();
    await generarLinks({ usuario: { id: 1 }, query: null }, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
