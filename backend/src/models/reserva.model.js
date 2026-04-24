// ============================================================
// BlindJourney – Modelo Reserva
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reserva = sequelize.define('Reserva', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  viaje_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  alojamiento: {
    type: DataTypes.STRING(255),
  },
  transporte: {
    type: DataTypes.STRING(255),
  },
  codigo_reserva_hotel: {
    type: DataTypes.STRING(100),
  },
  codigo_reserva_vuelo: {
    type: DataTypes.STRING(100),
  },
  estado: {
    type:         DataTypes.ENUM('pendiente', 'confirmada', 'cancelada'),
    defaultValue: 'pendiente',
  },
  fecha_reserva: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'reservas',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  'fecha_actualizacion',
});

module.exports = { Reserva };
