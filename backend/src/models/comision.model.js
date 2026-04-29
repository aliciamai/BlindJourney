// ============================================================
// BlindJourney – Modelo Comision
// Registra cada búsqueda generada desde el Buscador de viajes,
// base para el modelo de ingresos por comisiones de afiliados.
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comision = sequelize.define('Comision', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  usuario_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  viaje_id: {
    type: DataTypes.INTEGER,
  },
  tipo: {
    type:      DataTypes.ENUM('vuelo', 'hotel', 'experiencia', 'seguro'),
    allowNull: false,
  },
  proveedor: {
    type: DataTypes.STRING(100),
  },
  destino_ciudad: {
    type: DataTypes.STRING(100),
  },
  url_destino: {
    type: DataTypes.TEXT,
  },
}, {
  tableName:  'comisiones',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  false,
});

module.exports = { Comision };
