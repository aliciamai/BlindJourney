// ============================================================
// BlindJourney – Modelo Itinerario
// Generado por Google Gemini tras la revelación del destino
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Itinerario = sequelize.define('Itinerario', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  viaje_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  generado_por_ia: {
    type:         DataTypes.BOOLEAN,
    defaultValue: true,
  },
  destino_ciudad: {
    type: DataTypes.STRING(100),
  },
  destino_pais: {
    type: DataTypes.STRING(100),
  },
}, {
  tableName:  'itinerarios',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  'fecha_actualizacion',
});

module.exports = { Itinerario };
