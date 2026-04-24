// ============================================================
// BlindJourney – Asociaciones Sequelize y función de sync
// ============================================================

const sequelize            = require('../config/database');
const { Usuario }          = require('./usuario.model');
const { Perfil }           = require('./perfil.model');
const { Viaje }            = require('./viaje.model');
const { Candidato }        = require('./candidato.model');
const { Reserva }          = require('./reserva.model');
const { Pago }             = require('./pago.model');
const { Itinerario }       = require('./itinerario.model');
const { Actividad }        = require('./actividad.model');
const { Notificacion }     = require('./notificacion.model');

// ── Asociaciones ─────────────────────────────────────────────

// Usuario ↔ Perfil  (1:1)
Usuario.hasOne(Perfil, { foreignKey: 'usuario_id', as: 'perfil', onDelete: 'CASCADE' });
Perfil.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Usuario → Viajes  (1:N)
Usuario.hasMany(Viaje, { foreignKey: 'usuario_id', as: 'viajes', onDelete: 'CASCADE' });
Viaje.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Viaje → Candidatos  (1:N)
Viaje.hasMany(Candidato, { foreignKey: 'viaje_id', as: 'candidatos', onDelete: 'CASCADE' });
Candidato.belongsTo(Viaje, { foreignKey: 'viaje_id' });

// Viaje → Reserva  (1:1)
Viaje.hasOne(Reserva, { foreignKey: 'viaje_id', as: 'reserva', onDelete: 'CASCADE' });
Reserva.belongsTo(Viaje, { foreignKey: 'viaje_id', as: 'viaje' });

// Reserva → Pago  (1:1)
Reserva.hasOne(Pago, { foreignKey: 'reserva_id', as: 'pago', onDelete: 'CASCADE' });
Pago.belongsTo(Reserva, { foreignKey: 'reserva_id', as: 'reserva' });

// Viaje → Itinerario  (1:1)
Viaje.hasOne(Itinerario, { foreignKey: 'viaje_id', as: 'itinerario', onDelete: 'CASCADE' });
Itinerario.belongsTo(Viaje, { foreignKey: 'viaje_id' });

// Itinerario → Actividades  (1:N)
Itinerario.hasMany(Actividad, { foreignKey: 'itinerario_id', as: 'actividades', onDelete: 'CASCADE' });
Actividad.belongsTo(Itinerario, { foreignKey: 'itinerario_id' });

// Usuario → Notificaciones  (1:N)
Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones', onDelete: 'CASCADE' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// ── Inicialización de la BD ──────────────────────────────────
const inicializarDB = async () => {
  await sequelize.authenticate();
  console.log('✅ Conexión a MySQL establecida correctamente');

  // sync() crea las tablas si no existen. En producción usaríamos migraciones.
  await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  console.log('✅ Tablas sincronizadas con la base de datos');
};

module.exports = {
  sequelize,
  inicializarDB,
  Usuario,
  Perfil,
  Viaje,
  Candidato,
  Reserva,
  Pago,
  Itinerario,
  Actividad,
  Notificacion,
};
