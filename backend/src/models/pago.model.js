// ============================================================
// BlindJourney – Modelo Pago (Stripe)
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('Pago', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  reserva_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  // ID del PaymentIntent de Stripe
  stripe_payment_intent_id: {
    type:   DataTypes.STRING(255),
    unique: true,
  },
  // ID del cargo una vez completado
  stripe_charge_id: {
    type: DataTypes.STRING(255),
  },
  importe: {
    type:      DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  moneda: {
    type:         DataTypes.STRING(3),
    defaultValue: 'eur',
  },
  estado: {
    type:         DataTypes.ENUM('pendiente', 'completado', 'fallido', 'reembolsado'),
    defaultValue: 'pendiente',
  },
  fecha_pago: {
    type: DataTypes.DATE,
  },
}, {
  tableName:  'pagos',
  timestamps: true,
  createdAt:  'fecha_creacion',
  updatedAt:  'fecha_actualizacion',
});

module.exports = { Pago };
