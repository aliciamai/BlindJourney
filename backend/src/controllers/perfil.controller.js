// ============================================================
// BlindJourney – Controlador de Perfil
// ============================================================

const { Usuario, Perfil } = require('../models/index');

// ── GET /api/perfil/me ───────────────────────────────────────
const obtenerPerfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono', 'idioma', 'fecha_creacion'],
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const perfil = await Perfil.findOne({ where: { usuario_id: req.usuario.id } });

    res.json({ usuario, perfil: perfil || null });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/perfil/me ───────────────────────────────────────
// Acepta campos de la tabla usuarios (nombre, apellidos, telefono, idioma)
// y campos de la tabla perfiles (moneda, intereses, nivel_actividad, etc.)
const actualizarPerfil = async (req, res, next) => {
  try {
    const {
      nombre, apellidos, telefono, idioma,
      moneda, tipo_alojamiento, intereses,
      nivel_actividad, restricciones_alimentarias,
      notificaciones, ciudad_origen,
    } = req.body;

    // ── Tabla usuarios ──
    const camposUsuario = {};
    if (nombre    !== undefined) camposUsuario.nombre    = nombre;
    if (apellidos !== undefined) camposUsuario.apellidos = apellidos;
    if (telefono  !== undefined) camposUsuario.telefono  = telefono;
    if (idioma    !== undefined) camposUsuario.idioma    = idioma;

    if (Object.keys(camposUsuario).length > 0) {
      await Usuario.update(camposUsuario, { where: { id: req.usuario.id } });
    }

    // ── Tabla perfiles ──
    const camposPerfil = {};
    if (moneda                     !== undefined) camposPerfil.moneda                     = moneda;
    if (tipo_alojamiento           !== undefined) camposPerfil.tipo_alojamiento           = tipo_alojamiento;
    if (intereses                  !== undefined) camposPerfil.intereses                  = intereses;
    if (nivel_actividad            !== undefined) camposPerfil.nivel_actividad            = nivel_actividad;
    if (restricciones_alimentarias !== undefined) camposPerfil.restricciones_alimentarias = restricciones_alimentarias;
    if (notificaciones             !== undefined) camposPerfil.notificaciones             = notificaciones;
    if (ciudad_origen              !== undefined) camposPerfil.ciudad_origen              = ciudad_origen;

    if (Object.keys(camposPerfil).length > 0) {
      const [rows] = await Perfil.update(camposPerfil, { where: { usuario_id: req.usuario.id } });
      // Si no existía fila de perfil, la creamos
      if (rows === 0) {
        await Perfil.create({ usuario_id: req.usuario.id, ...camposPerfil });
      }
    }

    res.json({
      message: 'Perfil actualizado correctamente',
      cambios: { ...camposUsuario, ...camposPerfil },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerPerfil, actualizarPerfil };
