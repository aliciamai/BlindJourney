// ============================================================
// BlindJourney – Modelo Candidato
// Destinos sugeridos por IA para un viaje. El usuario puede
// vetar los que no le gusten antes de confirmar la reserva.
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Candidato = sequelize.define('Candidato', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  viaje_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  ciudad: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },
  pais: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },
  tipo_viaje: {
    type: DataTypes.STRING(50),
  },
  precio_estimado: {
    type: DataTypes.DECIMAL(10, 2),
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  // Pistas que se muestran en el modo sorpresa (sin revelar el destino)
  clima: {
    type: DataTypes.STRING(100),
  },
  idioma: {
    type: DataTypes.STRING(50),
  },
  duracion_vuelo: {
    type: DataTypes.STRING(50),
  },
  imagen_url: {
    type: DataTypes.STRING(500),
  },
  // Veto: el usuario no quiere ir a este destino
  vetado: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
  razon_veto: {
    type: DataTypes.STRING(255),
  },
  // Seleccionado: el sistema eligió este destino para el viaje
  seleccionado: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName:  'candidatos',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  false,
});

module.exports = { Candidato };
