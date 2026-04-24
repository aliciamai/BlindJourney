// ============================================================
// BlindJourney – Modelo Viaje
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ── Clase Sequelize ──────────────────────────────────────────
const Viaje = sequelize.define('Viaje', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  usuario_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  // Destino interno (no se muestra al usuario hasta la revelación)
  destino_ciudad: {
    type: DataTypes.STRING(100),
  },
  destino_pais: {
    type: DataTypes.STRING(100),
  },
  presupuesto: {
    type: DataTypes.DECIMAL(10, 2),
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
  },
  duracion: {
    type:    DataTypes.INTEGER,
    comment: 'Días de duración del viaje',
  },
  estado: {
    type:         DataTypes.ENUM('pendiente', 'confirmado', 'revelado', 'completado', 'cancelado'),
    defaultValue: 'pendiente',
  },
  destino_revelado: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
  fecha_revelacion: {
    type: DataTypes.DATE,
  },
  // Hora límite para la revelación automática (48 h tras la reserva)
  revelar_en: {
    type: DataTypes.DATE,
  },
}, {
  tableName:  'viajes',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  'fecha_actualizacion',
});

// ── Helpers stub (usados por revelacion.service.js) ──────────
const obtenerParaRevelar = async () => [];

const actualizarEstado = async () => true;

module.exports = {
  Viaje,
  obtenerParaRevelar,
  actualizarEstado,
};
