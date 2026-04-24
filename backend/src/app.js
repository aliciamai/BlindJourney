// ============================================================
// BlindJourney – Backend Node.js + Express
// Autora: Alicia Maillo
//
// Este archivo es el punto de entrada del servidor.
// Aquí configuramos Express, los middlewares y las rutas.
// ============================================================

// 'dotenv' carga las variables de entorno del archivo .env
// Debe ejecutarse ANTES de cualquier otro import que las use
require('dotenv').config();

// Express es el framework que nos permite crear un servidor HTTP
// con rutas, middlewares y controladores de forma sencilla
const express = require('express');

// cors permite que el frontend (que corre en otro puerto/dominio)
// pueda hacer peticiones al backend sin ser bloqueado por el navegador
const cors = require('cors');

// helmet añade cabeceras de seguridad HTTP automáticamente
// (ej: evita ataques XSS, clickjacking, etc.)
const helmet = require('helmet');

// express-rate-limit limita el número de peticiones por IP
// para protegernos de ataques de fuerza bruta
const rateLimit = require('express-rate-limit');

// Importamos las rutas de cada módulo (las crearemos después)
const authRoutes            = require('./routes/auth.routes');
const viajesRoutes          = require('./routes/viajes.routes');
const reservasRoutes        = require('./routes/reservas.routes');
const itinerariosRoutes     = require('./routes/itinerarios.routes');
const perfilRoutes          = require('./routes/perfil.routes');
const notificacionesRoutes  = require('./routes/notificaciones.routes');

// Importamos el servicio que comprueba cada minuto si hay viajes
// cuyo destino debe revelarse (timer automático de 48h)
const { iniciarTimerRevelacion } = require('./services/revelacion.service');

// inicializarDB crea/sincroniza las tablas en MySQL al arrancar
const { inicializarDB } = require('./models/index');

// Creamos la aplicación Express
const app = express();

// ── MIDDLEWARES GLOBALES ──────────────────────────────────────
// Los middlewares son funciones que se ejecutan ANTES de que
// la petición llegue a la ruta correspondiente. El orden importa.

// helmet() aplica varias cabeceras de seguridad de golpe
// contentSecurityPolicy se deshabilita para que el frontend tester
// (index.html con scripts inline) funcione correctamente
app.use(helmet({ contentSecurityPolicy: false }));

// cors() configura qué orígenes pueden hacer peticiones al backend
// Solo permitimos peticiones desde el frontend de BlindJourney
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  // credentials: true es necesario para enviar cookies con las peticiones
  credentials: true,
}));

// express.json() permite que Express entienda el cuerpo de las
// peticiones en formato JSON (ej: { "email": "...", "password": "..." })
app.use(express.json());

// Sirve el frontend tester desde /public (accesible en http://localhost:3001)
app.use(express.static(require('path').join(__dirname, 'public')));

// Limitamos a 100 peticiones por IP cada 15 minutos en las rutas de auth
// Esto protege contra ataques de fuerza bruta en el login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos en milisegundos
  max: 100,                   // máximo 100 peticiones en esa ventana
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' }
});

// ── RUTAS ────────────────────────────────────────────────────
// Cada grupo de rutas tiene su propio prefijo.
// Ej: POST /api/auth/login, GET /api/viajes, etc.

app.use('/api/auth',            authLimiter, authRoutes);
app.use('/api/viajes',          viajesRoutes);
app.use('/api/reservas',        reservasRoutes);
app.use('/api/itinerarios',     itinerariosRoutes);
app.use('/api/perfil',          perfilRoutes);
app.use('/api/notificaciones',  notificacionesRoutes);

// Ruta de health check: permite saber si el servidor está vivo
// Útil para herramientas de monitorización como AWS ELB
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── MANEJO DE ERRORES GLOBAL ──────────────────────────────────
// Este middleware especial (4 parámetros) captura cualquier error
// que no haya sido manejado en las rutas. Evita que el servidor
// devuelva el stack trace completo al cliente (información sensible)
app.use((err, req, res, next) => {
  // Logueamos el error completo en el servidor para debugging
  console.error('[ERROR]', err.stack);

  // Al cliente solo le decimos un mensaje genérico
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor',
    // En producción nunca enviamos el stack trace
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── INICIO DEL SERVIDOR ───────────────────────────────────────
const PORT = process.env.PORT || 3001;

// Primero sincronizamos las tablas con MySQL y luego abrimos el puerto.
// Si la BD no está disponible el proceso termina con error en lugar de
// arrancar en un estado inconsistente donde todo parece funcionar pero
// nada se guarda.
inicializarDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Servidor BlindJourney arrancado en http://localhost:${PORT}`);
      iniciarTimerRevelacion();
      console.log('⏰ Timer de revelación automática activado');
    });
  })
  .catch((err) => {
    console.error('❌ No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  });

module.exports = app; // Exportamos para los tests
