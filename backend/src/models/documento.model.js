// ============================================================
// BlindJourney – Modelo Documento (Sequelize) – RF-13
// Gestión de documentos de viaje: pasaporte, visa, billetes, etc.
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Documento = sequelize.define('Documento', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  usuario_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  // Asociación opcional al viaje concreto al que pertenece el documento.
  // NULL significa que es un documento general del usuario (ej: pasaporte).
  viaje_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM(
      'pasaporte',
      'visa',
      'billete_vuelo',
      'billete_tren',
      'reserva_hotel',
      'seguro',
      'otro'
    ),
    allowNull:    false,
    defaultValue: 'otro',
  },
  // Nombre descriptivo que ve el usuario (ej: "Mi pasaporte", "Vuelo MAD-ROM")
  nombre: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  nombre_archivo: {
    type: DataTypes.STRING(255),
  },
  // URL o path del archivo en el sistema de almacenamiento (ej: bucket S3).
  // El frontend sube el archivo directamente a S3 y nos envía la URL resultante.
  url_storage: {
    type: DataTypes.TEXT,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  fecha_expiracion: {
    type: DataTypes.DATEONLY,
  },
  // Soft delete: false = eliminado pero registro conservado
  activo: {
    type:         DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName:  'documentos',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  'fecha_actualizacion',
});

module.exports = { Documento };
