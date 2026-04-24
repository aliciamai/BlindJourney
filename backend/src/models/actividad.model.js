// ============================================================
// BlindJourney – Modelo Actividad
// Cada actividad pertenece a un día del itinerario
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Actividad = sequelize.define('Actividad', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  itinerario_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  dia: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    comment:   'Número de día del viaje (1, 2, 3...)',
  },
  hora: {
    type:    DataTypes.STRING(5),
    comment: 'Formato HH:MM, ej: 09:30',
  },
  nombre: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  tipo: {
    type:         DataTypes.ENUM('cultura', 'gastronomia', 'ocio', 'transporte', 'alojamiento', 'naturaleza'),
    defaultValue: 'ocio',
  },
  ubicacion: {
    type: DataTypes.STRING(255),
  },
  duracion_minutos: {
    type: DataTypes.INTEGER,
  },
  coste_estimado: {
    type: DataTypes.DECIMAL(10, 2),
  },
}, {
  tableName:  'actividades',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  false,
});

module.exports = { Actividad };
