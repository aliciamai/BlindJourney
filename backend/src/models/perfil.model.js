// ============================================================
// BlindJourney – Modelo Perfil (Sequelize)
// Preferencias de viaje y configuración del usuario
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Perfil = sequelize.define('Perfil', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  usuario_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    unique:    true,
  },
  idioma: {
    type:         DataTypes.STRING(5),
    defaultValue: 'es',
  },
  moneda: {
    type:         DataTypes.STRING(3),
    defaultValue: 'EUR',
  },
  tipo_alojamiento: {
    type: DataTypes.STRING(50),
  },
  intereses: {
    type:         DataTypes.JSON,
    defaultValue: [],
  },
  nivel_actividad: {
    type:         DataTypes.ENUM('tranquilo', 'moderado', 'activo', 'aventurero'),
    defaultValue: 'moderado',
  },
  restricciones_alimentarias: {
    type:         DataTypes.JSON,
    defaultValue: [],
  },
  notificaciones: {
    type:         DataTypes.JSON,
    defaultValue: { push: true, email: true, sms: false },
  },
  ciudad_origen: {
    type:         DataTypes.STRING(100),
    defaultValue: 'Madrid',
  },
}, {
  tableName:  'perfiles',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  'fecha_actualizacion',
});

// ── Métodos de servicio ──────────────────────────────────────

const buscarPorUsuarioId = async (usuarioId) =>
  Perfil.findOne({ where: { usuario_id: usuarioId } });

const crearPerfil = async (usuarioId, datos = {}) =>
  Perfil.create({ usuario_id: usuarioId, ...datos });

const actualizarPerfil = async (usuarioId, datos) => {
  await Perfil.update(datos, { where: { usuario_id: usuarioId } });
  return Perfil.findOne({ where: { usuario_id: usuarioId } });
};

module.exports = {
  Perfil,
  buscarPorUsuarioId,
  crearPerfil,
  actualizarPerfil,
};
