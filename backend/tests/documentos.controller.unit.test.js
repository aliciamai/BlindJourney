jest.mock('../src/models/index', () => ({
  Documento: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Viaje:     { findOne: jest.fn() },
}));

const { Documento, Viaje } = require('../src/models/index');
const {
  listarDocumentos,
  listarDocumentosDeViaje,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
} = require('../src/controllers/documentos.controller');

const makeReq = (opts = {}) => ({ usuario: { id: 1 }, params: {}, body: {}, query: {}, ...opts });
const makeRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };

describe('documentos – listarDocumentos', () => {
  it('devuelve los documentos del usuario', async () => {
    const docs = [{ id: 1 }, { id: 2 }];
    Documento.findAll.mockResolvedValue(docs);
    const res = makeRes();
    await listarDocumentos(makeReq(), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ documentos: docs });
  });

  it('llama next en error', async () => {
    Documento.findAll.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await listarDocumentos(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('documentos – listarDocumentosDeViaje', () => {
  it('404 si el viaje no pertenece al usuario', async () => {
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await listarDocumentosDeViaje(makeReq({ params: { viajeId: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Viaje no encontrado' });
  });

  it('devuelve documentos si el viaje existe', async () => {
    Viaje.findOne.mockResolvedValue({ id: 1 });
    const docs = [{ id: 10 }];
    Documento.findAll.mockResolvedValue(docs);
    const res = makeRes();
    await listarDocumentosDeViaje(makeReq({ params: { viajeId: '1' } }), res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ documentos: docs });
  });

  it('llama next en error', async () => {
    Viaje.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await listarDocumentosDeViaje(makeReq({ params: { viajeId: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('documentos – crearDocumento', () => {
  it('crea documento sin viaje_id y devuelve 201', async () => {
    const newDoc = { id: 5 };
    Documento.create.mockResolvedValue(newDoc);
    const res = makeRes();
    await crearDocumento(makeReq({ body: { nombre: 'Pasaporte', tipo: 'pasaporte' } }), res, jest.fn());
    expect(Documento.create).toHaveBeenCalledWith(expect.objectContaining({ usuario_id: 1, viaje_id: null }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ documento: newDoc });
  });

  it('404 si viaje_id no pertenece al usuario', async () => {
    Viaje.findOne.mockResolvedValue(null);
    const res = makeRes();
    await crearDocumento(makeReq({ body: { nombre: 'Visa', viaje_id: 99 } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('crea documento con viaje_id válido', async () => {
    Viaje.findOne.mockResolvedValue({ id: 2 });
    const newDoc = { id: 6 };
    Documento.create.mockResolvedValue(newDoc);
    const res = makeRes();
    await crearDocumento(makeReq({ body: { nombre: 'Seguro', viaje_id: 2, tipo: 'seguro', nombre_archivo: 'doc.pdf', url_storage: 'http://s3.com/doc.pdf', descripcion: 'Seguro médico', fecha_expiracion: '2026-12-31' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('usa tipo "otro" si no se envía', async () => {
    Documento.create.mockResolvedValue({ id: 7 });
    await crearDocumento(makeReq({ body: { nombre: 'Doc' } }), makeRes(), jest.fn());
    expect(Documento.create).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'otro' }));
  });

  it('llama next en error', async () => {
    Documento.create.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await crearDocumento(makeReq({ body: { nombre: 'X' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('documentos – actualizarDocumento', () => {
  it('404 si no existe el documento', async () => {
    Documento.findOne.mockResolvedValue(null);
    const res = makeRes();
    await actualizarDocumento(makeReq({ params: { id: '99' }, body: {} }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('actualiza los campos enviados', async () => {
    const mockDoc = { id: 1, update: jest.fn().mockResolvedValue({}) };
    Documento.findOne.mockResolvedValue(mockDoc);
    const res = makeRes();
    await actualizarDocumento(makeReq({ params: { id: '1' }, body: { nombre: 'Nuevo', tipo: 'visa', descripcion: 'Desc', fecha_expiracion: '2027-01-01', url_storage: 'http://s3.com/new.pdf' } }), res, jest.fn());
    expect(mockDoc.update).toHaveBeenCalledWith({ nombre: 'Nuevo', tipo: 'visa', descripcion: 'Desc', fecha_expiracion: '2027-01-01', url_storage: 'http://s3.com/new.pdf' });
    expect(res.json).toHaveBeenCalledWith({ documento: mockDoc });
  });

  it('solo actualiza los campos presentes en body', async () => {
    const mockDoc = { id: 1, update: jest.fn().mockResolvedValue({}) };
    Documento.findOne.mockResolvedValue(mockDoc);
    await actualizarDocumento(makeReq({ params: { id: '1' }, body: { nombre: 'Solo nombre' } }), makeRes(), jest.fn());
    expect(mockDoc.update).toHaveBeenCalledWith({ nombre: 'Solo nombre' });
  });

  it('llama next en error', async () => {
    Documento.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await actualizarDocumento(makeReq({ params: { id: '1' }, body: {} }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('documentos – eliminarDocumento', () => {
  it('404 si no existe', async () => {
    Documento.findOne.mockResolvedValue(null);
    const res = makeRes();
    await eliminarDocumento(makeReq({ params: { id: '99' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('soft-delete: marca activo=false', async () => {
    const mockDoc = { id: 1, update: jest.fn().mockResolvedValue({}) };
    Documento.findOne.mockResolvedValue(mockDoc);
    const res = makeRes();
    await eliminarDocumento(makeReq({ params: { id: '1' } }), res, jest.fn());
    expect(mockDoc.update).toHaveBeenCalledWith({ activo: false });
    expect(res.json).toHaveBeenCalledWith({ message: 'Documento eliminado correctamente' });
  });

  it('llama next en error', async () => {
    Documento.findOne.mockRejectedValue(new Error('DB'));
    const next = jest.fn();
    await eliminarDocumento(makeReq({ params: { id: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
