jest.mock('../src/models/index', () => ({
  Viaje:     { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Candidato: { bulkCreate: jest.fn() },
  Perfil:    { findOne: jest.fn() },
}));

jest.mock('../src/services/gemini.service', () => ({
  generarCandidatos: jest.fn(),
}));

const { Viaje, Candidato, Perfil } = require('../src/models/index');
const geminiService = require('../src/services/gemini.service');
const { listarViajes, obtenerViajePorId, crearViaje, revelarDestino } = require('../src/controllers/viajes.controller');

const makeReq = (opts = {}) => ({ usuario: { id: 1 }, params: {}, body: {}, query: {}, ...opts });
const makeRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };

describe('viajes – listarViajes', () => {
  it('devuelve lista y total', async () => {
    const viajes = [{ id: 1 }, { id: 2 }];
    Viaje.findAll.mockResolvedValue(viajes);
    const res = makeRes();
    await listarViajes(makeReq(), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ viajes, total: 2 });
  });

  it('llama next en error', async () => {
    Viaje.findAll.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await listarViajes(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('viajes – obtenerViajePorId', () => {
  it('404 si el viaje no existe', async () => {
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await obtenerViajePorId(makeReq({ params: { id: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Viaje no encontrado' });
  });

  it('devuelve el viaje con candidatos', async () => {
    const mockViaje = { id: 1, candidatos: [] };
    Viaje.findOne.mockResolvedValue(mockViaje);
    const res = makeRes();
    await obtenerViajePorId(makeReq({ params: { id: '1' } }), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(mockViaje);
  });

  it('llama next en error', async () => {
    Viaje.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await obtenerViajePorId(makeReq({ params: { id: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('viajes – crearViaje', () => {
  it('crea viaje y candidatos con IA', async () => {
    const mockViaje = { id: 10 };
    Viaje.create.mockResolvedValue(mockViaje);
    Perfil.findOne.mockResolvedValue({ intereses: ['cultura'], nivel_actividad: 'moderado', restricciones_alimentarias: [] });
    const candidatos = [
      { ciudad: 'París', pais: 'Francia', tipo_viaje: 'cultura', precio_estimado: 700, descripcion: 'Desc', clima: 'Cálido', idioma: 'Francés', duracion_vuelo: '2h' },
    ];
    geminiService.generarCandidatos.mockResolvedValue(candidatos);
    Candidato.bulkCreate.mockResolvedValue([]);
    const res = makeRes();
    await crearViaje(makeReq({ body: { destino: 'sorpresa', presupuesto: 1000, fechaInicio: '2025-06-01', duracion: 7 } }), res, jest.fn());
    expect(Viaje.create).toHaveBeenCalledWith(expect.objectContaining({ usuario_id: 1, estado: 'pendiente' }));
    expect(Candidato.bulkCreate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Viaje creado correctamente', viaje: mockViaje });
  });

  it('crea viaje incluso si la IA falla (graceful fallback)', async () => {
    const mockViaje = { id: 11 };
    Viaje.create.mockResolvedValue(mockViaje);
    Perfil.findOne.mockResolvedValue(null);
    geminiService.generarCandidatos.mockRejectedValue(new Error('IA no disponible'));
    const res = makeRes();
    await crearViaje(makeReq({ body: {} }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Viaje creado correctamente', viaje: mockViaje });
  });

  it('usa valores por defecto cuando no se envían parámetros', async () => {
    const mockViaje = { id: 12 };
    Viaje.create.mockResolvedValue(mockViaje);
    Perfil.findOne.mockResolvedValue(null);
    geminiService.generarCandidatos.mockResolvedValue([]);
    Candidato.bulkCreate.mockResolvedValue([]);
    await crearViaje(makeReq({ body: {} }), makeRes(), jest.fn());
    expect(Viaje.create).toHaveBeenCalledWith(expect.objectContaining({ destino_ciudad: null, presupuesto: null }));
  });

  it('llama next si Viaje.create falla', async () => {
    Viaje.create.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await crearViaje(makeReq({ body: {} }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('viajes – revelarDestino', () => {
  it('404 si el viaje no existe', async () => {
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await revelarDestino(makeReq({ params: { id: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Viaje no encontrado' });
  });

  it('409 si el destino ya fue revelado', async () => {
    Viaje.findOne.mockResolvedValue({ id: 1, destino_revelado: true });
    const res = makeRes();
    await revelarDestino(makeReq({ params: { id: '1' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El destino ya fue revelado' });
  });

  it('revela el destino correctamente', async () => {
    const mockViaje = {
      id: 1, destino_revelado: false,
      update: jest.fn().mockResolvedValue({}),
      reload: jest.fn().mockResolvedValue({}),
    };
    Viaje.findOne.mockResolvedValue(mockViaje);
    const res = makeRes();
    await revelarDestino(makeReq({ params: { id: '1' } }), res, jest.fn());
    expect(mockViaje.update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'revelado', destino_revelado: true }));
    expect(mockViaje.reload).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Destino revelado', viaje: mockViaje });
  });

  it('llama next en error', async () => {
    Viaje.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await revelarDestino(makeReq({ params: { id: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
