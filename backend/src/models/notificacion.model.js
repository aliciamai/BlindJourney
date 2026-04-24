// ============================================================
// BlindJourney – Modelo Notificacion
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ── Clase Sequelize ──────────────────────────────────────────
const Notificacion = sequelize.define('Notificacion', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  usuario_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type:         DataTypes.STRING(50),
    defaultValue: 'info',
    comment:      'revelacion_destino | recordatorio | confirmacion | sistema',
  },
  titulo: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  mensaje: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
  leida: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Payload extra: viajeId, url de acción, etc.
  datos_extra: {
    type:         DataTypes.JSON,
    defaultValue: {},
  },
}, {
  tableName:  'notificaciones',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  false,
});

// ── Helper stub (usado por revelacion.service.js) ────────────
const crear = async (datos) => datos;

module.exports = {
  Notificacion,
  crear,
};
