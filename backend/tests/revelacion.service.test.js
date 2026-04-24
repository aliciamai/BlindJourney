jest.mock('../src/models/viaje.model');
jest.mock('../src/models/notificacion.model');
jest.mock('../src/services/email.service', () => ({
  enviarVerificacion: jest.fn().mockResolvedValue(true),
  enviarRecuperacion: jest.fn().mockResolvedValue(true),
  enviarRevelacion: jest.fn().mockResolvedValue(true),
}));

const ViajeModel = require('../src/models/viaje.model');
const NotifModel = require('../src/models/notificacion.model');
const { comprobarRevelaciones, iniciarTimerRevelacion } = require('../src/services/revelacion.service');

beforeEach(() => jest.clearAllMocks());

describe('comprobarRevelaciones', () => {
  it('no hace nada si no hay viajes a revelar', async () => {
    ViajeModel.obtenerParaRevelar.mockResolvedValue([]);
    await expect(comprobarRevelaciones()).resolves.toBeUndefined();
    expect(ViajeModel.actualizarEstado).not.toHaveBeenCalled();
  });

  it('procesa los viajes pendientes', async () => {
    const viaje = { id: 1, usuario_id: 5, usuario_email: 'a@b.com', usuario_nombre: 'A', destino_ciudad: 'Paris', fecha_inicio: '2026-05-01' };
    ViajeModel.obtenerParaRevelar.mockResolvedValue([viaje]);
    ViajeModel.actualizarEstado.mockResolvedValue(true);
    NotifModel.crear.mockResolvedValue({});

    await comprobarRevelaciones();

    expect(ViajeModel.actualizarEstado).toHaveBeenCalledWith(1, 'revelado');
    expect(NotifModel.crear).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 5, tipo: 'revelacion_destino' }));
  });

  it('no lanza error si obtenerParaRevelar falla', async () => {
    ViajeModel.obtenerParaRevelar.mockRejectedValue(new Error('DB error'));
    await expect(comprobarRevelaciones()).resolves.toBeUndefined();
  });
});

describe('iniciarTimerRevelacion', () => {
  it('ejecuta una comprobación inmediata al arrancar', async () => {
    jest.useFakeTimers();
    ViajeModel.obtenerParaRevelar.mockResolvedValue([]);

    iniciarTimerRevelacion();

    expect(ViajeModel.obtenerParaRevelar).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
