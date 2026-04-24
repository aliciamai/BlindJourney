const ViajeModel = require('../src/models/viaje.model');

describe('ViajeModel', () => {
  it('obtenerParaRevelar devuelve array vacío', async () => {
    const result = await ViajeModel.obtenerParaRevelar();
    expect(result).toEqual([]);
  });

  it('actualizarEstado devuelve true', async () => {
    const result = await ViajeModel.actualizarEstado(1, 'revelado');
    expect(result).toBe(true);
  });
});
