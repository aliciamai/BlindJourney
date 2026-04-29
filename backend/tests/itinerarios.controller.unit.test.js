jest.mock('../src/models/index', () => ({
  Viaje:       { findOne: jest.fn() },
  Perfil:      { findOne: jest.fn() },
  Itinerario:  { findOne: jest.fn(), create: jest.fn() },
  Actividad:   { findByPk: jest.fn(), create: jest.fn(), destroy: jest.fn() },
}));

jest.mock('../src/services/gemini.service', () => ({
  generarItinerario: jest.fn(),
}));

const { Viaje, Perfil, Itinerario, Actividad } = require('../src/models/index');
const geminiService = require('../src/services/gemini.service');
const {
  obtenerItinerarioDeViaje,
  regenerarItinerario,
  actualizarActividad,
  eliminarActividad,
} = require('../src/controllers/itinerarios.controller');

const makeReq = (opts = {}) => ({ usuario: { id: 1 }, params: {}, body: {}, query: {}, ...opts });
const makeRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };

describe('itinerarios – obtenerItinerarioDeViaje', () => {
  it('404 si el viaje no existe', async () => {
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await obtenerItinerarioDeViaje(makeReq({ params: { viajeId: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Viaje no encontrado' });
  });

  it('404 si el itinerario no existe', async () => {
    Viaje.findOne.mockResolvedValue({ id: 1 });
    Itinerario.findOne.mockResolvedValue(null);
    const res = makeRes();
    await obtenerItinerarioDeViaje(makeReq({ params: { viajeId: '1' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Este viaje aún no tiene itinerario generado' });
  });

  it('devuelve el itinerario con actividades', async () => {
    Viaje.findOne.mockResolvedValue({ id: 1 });
    const mockItinerario = { id: 5, actividades: [{ id: 1 }] };
    Itinerario.findOne.mockResolvedValue(mockItinerario);
    const res = makeRes();
    await obtenerItinerarioDeViaje(makeReq({ params: { viajeId: '1' } }), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(mockItinerario);
  });

  it('llama next en error', async () => {
    Viaje.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await obtenerItinerarioDeViaje(makeReq({ params: { viajeId: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('itinerarios – regenerarItinerario', () => {
  const mockViaje = { id: 1, destino_ciudad: 'París', destino_pais: 'Francia', duracion: 3, presupuesto: 900, destino_revelado: true, usuario_id: 1 };

  it('404 si el viaje no existe', async () => {
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await regenerarItinerario(makeReq({ params: { viajeId: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('409 si el destino aún no ha sido revelado', async () => {
    Viaje.findOne.mockResolvedValue({ ...mockViaje, destino_revelado: false });
    const res = makeRes();
    await regenerarItinerario(makeReq({ params: { viajeId: '1' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El destino aún no ha sido revelado' });
  });

  it('regenera itinerario borrando el anterior', async () => {
    Viaje.findOne.mockResolvedValue(mockViaje);
    Perfil.findOne.mockResolvedValue({ intereses: ['cultura'], nivel_actividad: 'activo', restricciones_alimentarias: [] });

    const dias = [{ dia: 1, actividades: [{ hora: '10:00', nombre: 'Torre Eiffel', descripcion: 'Famosa torre', tipo: 'cultura', ubicacion: 'Centro', duracion_minutos: 120, coste_estimado: 15 }] }];
    geminiService.generarItinerario.mockResolvedValue(dias);

    const mockAnterior = { id: 99, destroy: jest.fn().mockResolvedValue(1) };
    const mockNuevo = { id: 100 };
    Itinerario.findOne
      .mockResolvedValueOnce(mockAnterior)
      .mockResolvedValueOnce({ id: 100, actividades: [] });
    Actividad.destroy.mockResolvedValue(1);
    Itinerario.create.mockResolvedValue(mockNuevo);
    Actividad.create.mockResolvedValue({ id: 1 });

    const res = makeRes();
    await regenerarItinerario(makeReq({ params: { viajeId: '1' } }), res, jest.fn());
    expect(Actividad.destroy).toHaveBeenCalledWith({ where: { itinerario_id: 99 } });
    expect(mockAnterior.destroy).toHaveBeenCalled();
    expect(Itinerario.create).toHaveBeenCalled();
    expect(Actividad.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Itinerario generado correctamente' }));
  });

  it('regenera itinerario cuando no hay anterior', async () => {
    Viaje.findOne.mockResolvedValue(mockViaje);
    Perfil.findOne.mockResolvedValue(null);
    geminiService.generarItinerario.mockResolvedValue([{ dia: 1, actividades: [] }]);
    Itinerario.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 101, actividades: [] });
    Itinerario.create.mockResolvedValue({ id: 101 });

    const res = makeRes();
    await regenerarItinerario(makeReq({ params: { viajeId: '1' } }), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Itinerario generado correctamente' }));
  });

  it('usa presupuesto nulo si no hay presupuesto en el viaje', async () => {
    Viaje.findOne.mockResolvedValue({ ...mockViaje, presupuesto: null, duracion: null });
    Perfil.findOne.mockResolvedValue(null);
    geminiService.generarItinerario.mockResolvedValue([]);
    Itinerario.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 102, actividades: [] });
    Itinerario.create.mockResolvedValue({ id: 102 });

    await regenerarItinerario(makeReq({ params: { viajeId: '1' } }), makeRes(), jest.fn());
    expect(geminiService.generarItinerario).toHaveBeenCalledWith(expect.objectContaining({ presupuestoDiario: 100, diasViaje: 7 }));
  });

  it('llama next en error de IA', async () => {
    Viaje.findOne.mockResolvedValue(mockViaje);
    Perfil.findOne.mockResolvedValue(null);
    geminiService.generarItinerario.mockRejectedValue(new Error('IA error'));
    const next = jest.fn();
    await regenerarItinerario(makeReq({ params: { viajeId: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('itinerarios – actualizarActividad', () => {
  it('404 si la actividad no existe', async () => {
    Actividad.findByPk.mockResolvedValue(null);
    const res = makeRes();
    await actualizarActividad(makeReq({ params: { actividadId: '99' }, body: { importante: true } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Actividad no encontrada' });
  });

  it('403 si el itinerario no pertenece al usuario', async () => {
    Actividad.findByPk.mockResolvedValue({ id: 5, itinerario_id: 10 });
    Itinerario.findOne.mockResolvedValue({ id: 10, viaje_id: 20 });
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await actualizarActividad(makeReq({ params: { actividadId: '5' }, body: {} }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Sin permisos sobre esta actividad' });
  });

  it('actualiza importante y completada', async () => {
    const mockActividad = { id: 5, itinerario_id: 10, update: jest.fn().mockResolvedValue({}) };
    Actividad.findByPk.mockResolvedValue(mockActividad);
    Itinerario.findOne.mockResolvedValue({ id: 10, viaje_id: 20 });
    Viaje.findOne.mockResolvedValue({ id: 20, usuario_id: 1 });
    const res = makeRes();
    await actualizarActividad(makeReq({ params: { actividadId: '5' }, body: { importante: true, completada: false } }), res, jest.fn());
    expect(mockActividad.update).toHaveBeenCalledWith({ importante: true, completada: false });
    expect(res.json).toHaveBeenCalledWith({ message: 'Actividad actualizada', actividad: mockActividad });
  });

  it('actualiza solo los campos presentes en body', async () => {
    const mockActividad = { id: 5, itinerario_id: 10, update: jest.fn().mockResolvedValue({}) };
    Actividad.findByPk.mockResolvedValue(mockActividad);
    Itinerario.findOne.mockResolvedValue({ id: 10, viaje_id: 20 });
    Viaje.findOne.mockResolvedValue({ id: 20, usuario_id: 1 });
    await actualizarActividad(makeReq({ params: { actividadId: '5' }, body: { importante: true } }), makeRes(), jest.fn());
    expect(mockActividad.update).toHaveBeenCalledWith({ importante: true });
  });

  it('llama next en error', async () => {
    Actividad.findByPk.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await actualizarActividad(makeReq({ params: { actividadId: '5' }, body: {} }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('itinerarios – eliminarActividad', () => {
  it('404 si la actividad no existe', async () => {
    Actividad.findByPk.mockResolvedValue(null);
    const res = makeRes();
    await eliminarActividad(makeReq({ params: { actividadId: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Actividad no encontrada' });
  });

  it('403 si el itinerario no pertenece al usuario', async () => {
    Actividad.findByPk.mockResolvedValue({ id: 5, itinerario_id: 10 });
    Itinerario.findOne.mockResolvedValue({ id: 10, viaje_id: 20 });
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await eliminarActividad(makeReq({ params: { actividadId: '5' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('elimina la actividad correctamente', async () => {
    const mockActividad = { id: 5, itinerario_id: 10, destroy: jest.fn().mockResolvedValue(1) };
    Actividad.findByPk.mockResolvedValue(mockActividad);
    Itinerario.findOne.mockResolvedValue({ id: 10, viaje_id: 20 });
    Viaje.findOne.mockResolvedValue({ id: 20, usuario_id: 1 });
    const res = makeRes();
    await eliminarActividad(makeReq({ params: { actividadId: '5' } }), res, jest.fn());
    expect(mockActividad.destroy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Actividad eliminada' });
  });

  it('llama next en error', async () => {
    Actividad.findByPk.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await eliminarActividad(makeReq({ params: { actividadId: '5' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
