// ============================================================
// BlindJourney - Servicio de revelacion automatica
// ============================================================

const comprobarRevelaciones = async () => {
  try {
    const ViajeModel = require('../models/viaje.model');
    const NotifModel = require('../models/notificacion.model');
    const emailService = require('./email.service');

    const viajesARevelar = await ViajeModel.obtenerParaRevelar();

    if (!Array.isArray(viajesARevelar) || viajesARevelar.length === 0) {
      return;
    }

    await Promise.all(viajesARevelar.map(async (viaje) => {
      await ViajeModel.actualizarEstado(viaje.id, 'revelado');
      await NotifModel.crear({
        usuarioId: viaje.usuario_id,
        tipo: 'revelacion_destino',
        titulo: 'Tu destino esta listo',
        mensaje: `Ya puedes ver adonde viajas el ${viaje.fecha_inicio}.`,
        canal: 'push',
        viajeId: viaje.id,
      });

      await emailService.enviarRevelacion(
        viaje.usuario_email,
        viaje.usuario_nombre,
        viaje.destino_ciudad,
        viaje.id
      );
    }));
  } catch (error) {
    console.warn('[REVELACION] Servicio en modo base:', error.message);
  }
};

const iniciarTimerRevelacion = () => {
  comprobarRevelaciones();
  setInterval(comprobarRevelaciones, 60 * 1000);
};

module.exports = {
  iniciarTimerRevelacion,
  comprobarRevelaciones,
};
