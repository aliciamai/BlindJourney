// ============================================================
// BlindJourney – Conexión a MySQL con Sequelize
// ============================================================

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'blindjourney',
  process.env.DB_USER     || 'root',
  process.env.DB_PASSWORD || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',

    // Solo logueamos queries en desarrollo
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    pool: {
      max:     10,
      min:     0,
      acquire: 30000,
      idle:    10000,
    },

    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  }
);

module.exports = sequelize;
