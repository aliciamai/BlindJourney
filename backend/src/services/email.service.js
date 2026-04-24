// ============================================================
// BlindJourney - Servicio de email
// ============================================================

const logEnvio = async (tipo, ...datos) => {
  console.log(`[EMAIL] ${tipo}:`, ...datos);
  return true;
};

const enviarVerificacion = async (email, nombre, token) =>
  logEnvio('verificacion', { email, nombre, token });

const enviarRecuperacion = async (email, nombre, token) =>
  logEnvio('recuperacion', { email, nombre, token });

const enviarRevelacion = async (email, nombre, destino, viajeId) =>
  logEnvio('revelacion', { email, nombre, destino, viajeId });

module.exports = {
  enviarVerificacion,
  enviarRecuperacion,
  enviarRevelacion,
};
