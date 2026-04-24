// ============================================================
// BlindJourney – Modelo Usuario
// ============================================================

const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

// ── Clase Sequelize ──────────────────────────────────────────
const Usuario = sequelize.define('Usuario', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  nombre: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },
  apellidos: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    unique:    true,
  },
  password_hash: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING(20),
  },
  email_verificado: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
  token_verificacion: {
    type: DataTypes.STRING(128),
  },
  refresh_token: {
    type: DataTypes.TEXT,
  },
  reset_token: {
    type: DataTypes.STRING(128),
  },
  reset_expiracion: {
    type: DataTypes.DATE,
  },
  idioma: {
    type:         DataTypes.STRING(5),
    defaultValue: 'es',
  },
}, {
  tableName:  'usuarios',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  'fecha_actualizacion',
});

// ── Helpers con Sequelize (usados por auth.controller.js) ────
// Los nombres de las claves de entrada siguen el contrato del
// controlador (camelCase) y se mapean a las columnas snake_case.

const buscarPorEmail = (email) =>
  Usuario.findOne({ where: { email } });

const buscarPorId = (id) =>
  Usuario.findByPk(id);

const crear = (datos) =>
  Usuario.create({
    nombre:             datos.nombre,
    apellidos:          datos.apellidos,
    email:              datos.email,
    password_hash:      datos.passwordHash,
    telefono:           datos.telefono || null,
    token_verificacion: datos.tokenVerificacion,
  });

const guardarRefreshToken = (usuarioId, refreshToken) =>
  Usuario.update(
    { refresh_token: refreshToken },
    { where: { id: usuarioId } }
  );

const eliminarRefreshToken = (refreshToken) =>
  Usuario.update(
    { refresh_token: null },
    { where: { refresh_token: refreshToken } }
  );

const buscarPorTokenVerificacion = (token) =>
  Usuario.findOne({ where: { token_verificacion: token } });

const verificarEmail = (usuarioId) =>
  Usuario.update(
    { email_verificado: true, token_verificacion: null },
    { where: { id: usuarioId } }
  );

const guardarTokenReset = (usuarioId, tokenReset, expiracion) =>
  Usuario.update(
    { reset_token: tokenReset, reset_expiracion: expiracion },
    { where: { id: usuarioId } }
  );

const buscarPorTokenReset = (token) =>
  Usuario.findOne({
    where: {
      reset_token:      token,
      reset_expiracion: { [Op.gt]: new Date() },
    },
  });

const actualizarPassword = (usuarioId, passwordHash) =>
  Usuario.update(
    { password_hash: passwordHash, reset_token: null, reset_expiracion: null },
    { where: { id: usuarioId } }
  );

const verificarRefreshToken = async (usuarioId, refreshToken) => {
  const u = await Usuario.findOne({
    where: { id: usuarioId, refresh_token: refreshToken },
  });
  return Boolean(u);
};

module.exports = {
  Usuario,
  buscarPorEmail,
  buscarPorId,
  crear,
  guardarRefreshToken,
  eliminarRefreshToken,
  buscarPorTokenVerificacion,
  verificarEmail,
  guardarTokenReset,
  buscarPorTokenReset,
  actualizarPassword,
  verificarRefreshToken,
};
