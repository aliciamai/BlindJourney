jest.mock('../src/models/index', () => ({
  Foto:  { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Viaje: { findOne: jest.fn() },
}));

const { Foto, Viaje } = require('../src/models/index');
const { listarFotosDeViaje, subirFoto, eliminarFoto } = require('../src/controllers/fotos.controller');

const makeReq = (opts = {}) => ({ usuario: { id: 1 }, params: {}, body: {}, query: {}, ...opts });
const makeRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };

describe('fotos – listarFotosDeViaje', () => {
  it('404 si el viaje no pertenece al usuario', async () => {
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await listarFotosDeViaje(makeReq({ params: { viajeId: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Viaje no encontrado' });
  });

  it('devuelve lista de fotos del viaje', async () => {
    Viaje.findOne.mockResolvedValue({ id: 1 });
    const fotos = [{ id: 10 }, { id: 11 }];
    Foto.findAll.mockResolvedValue(fotos);
    const res = makeRes();
    await listarFotosDeViaje(makeReq({ params: { viajeId: '1' } }), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(fotos);
  });

  it('llama next en error', async () => {
    Viaje.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await listarFotosDeViaje(makeReq({ params: { viajeId: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('fotos – subirFoto', () => {
  it('404 si el viaje no existe', async () => {
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await subirFoto(makeReq({ params: { viajeId: '99' }, body: { url: 'http://img.com/foto.jpg' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('400 si falta url', async () => {
    Viaje.findOne.mockResolvedValue({ id: 1 });
    const res = makeRes();
    await subirFoto(makeReq({ params: { viajeId: '1' }, body: {} }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'url es requerida' });
  });

  it('crea foto con todos los campos opcionales', async () => {
    const mockViaje = { id: 1 };
    Viaje.findOne.mockResolvedValue(mockViaje);
    const newFoto = { id: 5 };
    Foto.create.mockResolvedValue(newFoto);
    const res = makeRes();
    await subirFoto(makeReq({
      params: { viajeId: '1' },
      body: { url: 'http://img.com/foto.jpg', descripcion: 'Playa', ubicacion_nombre: 'Costa', latitud: '40.5', longitud: '2.3', fecha_foto: '2025-07-01' },
    }), res, jest.fn());
    expect(Foto.create).toHaveBeenCalledWith(expect.objectContaining({
      viaje_id: 1, usuario_id: 1, url: 'http://img.com/foto.jpg',
      latitud: 40.5, longitud: 2.3,
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Foto añadida', foto: newFoto });
  });

  it('crea foto con campos null cuando no se envían opcionales', async () => {
    Viaje.findOne.mockResolvedValue({ id: 1 });
    Foto.create.mockResolvedValue({ id: 6 });
    await subirFoto(makeReq({ params: { viajeId: '1' }, body: { url: 'http://img.com/x.jpg' } }), makeRes(), jest.fn());
    expect(Foto.create).toHaveBeenCalledWith(expect.objectContaining({
      descripcion: null, ubicacion_nombre: null, latitud: null, longitud: null,
    }));
  });

  it('llama next en error', async () => {
    Viaje.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await subirFoto(makeReq({ params: { viajeId: '1' }, body: { url: 'http://x.jpg' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('fotos – eliminarFoto', () => {
  it('404 si la foto no existe o no pertenece al usuario', async () => {
    Foto.findOne.mockResolvedValue(null);
    const res = makeRes();
    await eliminarFoto(makeReq({ params: { id: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Foto no encontrada' });
  });

  it('soft-delete: marca activo=false', async () => {
    const mockFoto = { id: 1, update: jest.fn().mockResolvedValue({}) };
    Foto.findOne.mockResolvedValue(mockFoto);
    const res = makeRes();
    await eliminarFoto(makeReq({ params: { id: '1' } }), res, jest.fn());
    expect(mockFoto.update).toHaveBeenCalledWith({ activo: false });
    expect(res.json).toHaveBeenCalledWith({ message: 'Foto eliminada' });
  });

  it('llama next en error', async () => {
    Foto.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await eliminarFoto(makeReq({ params: { id: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
