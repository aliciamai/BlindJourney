require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const viajesRoutes = require('./routes/viajes.routes');
const reservasRoutes = require('./routes/reservas.routes');
const itinerariosRoutes = require('./routes/itinerarios.routes');
const perfilRoutes = require('./routes/perfil.routes');

const createApp = () => {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas peticiones. Intenta mas tarde.' },
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/viajes', viajesRoutes);
  app.use('/api/reservas', reservasRoutes);
  app.use('/api/itinerarios', itinerariosRoutes);
  app.use('/api/perfil', perfilRoutes);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: err.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  return app;
};

module.exports = createApp;
