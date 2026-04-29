// ============================================================
// BlindJourney – Modelo Foto
// Álbum de recuerdos por viaje
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Foto = sequelize.define('Foto', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  viaje_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  // Almacena URL externa o data URL base64 para demo sin S3
  url: {
    type:      DataTypes.TEXT('long'),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(500),
  },
  ubicacion_nombre: {
    type: DataTypes.STRING(255),
  },
  latitud: {
    type: DataTypes.DECIMAL(10, 8),
  },
  longitud: {
    type: DataTypes.DECIMAL(11, 8),
  },
  fecha_foto: {
    type: DataTypes.DATE,
  },
  activo: {
    type:         DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName:  'fotos_viaje',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  false,
});

module.exports = { Foto };
