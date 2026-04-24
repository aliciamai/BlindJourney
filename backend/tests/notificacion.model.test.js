const NotifModel = require('../src/models/notificacion.model');

describe('NotificacionModel', () => {
  it('crear devuelve la misma notificación recibida', async () => {
    const notif = { usuarioId: 1, tipo: 'revelacion', titulo: 'Hola', mensaje: 'Msg', canal: 'push', viajeId: 3 };
    const result = await NotifModel.crear(notif);
    expect(result).toEqual(notif);
  });
});
