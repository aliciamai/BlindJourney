# BlindJourney – Backend API

**Autora:** Alicia Maillo  
**Stack:** Node.js · Express · MySQL · JWT · Stripe · Google Gemini

---

## Descripción

API REST del sistema BlindJourney, una plataforma de viajes sorpresa que oculta el destino al usuario hasta 48 horas antes de la salida, utilizando inteligencia artificial para personalizar itinerarios.

---

## Instalación y Arranque

### Requisitos previos
- Node.js 18+
- MySQL 8+

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/alicia-maillo/blindjourney.git
cd blindjourney/backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Crear la base de datos
mysql -u root -p < ../database/blindjourney_schema.sql

# 5. Arrancar en modo desarrollo (con auto-reload)
npm run dev

# 6. Arrancar en producción
npm start
```

---

## Variables de Entorno (.env)

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=blindjourney
DB_USER=root
DB_PASSWORD=tu_password

JWT_SECRET=cambia_esto_por_algo_muy_secreto_y_largo
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

GEMINI_API_KEY=...

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=blindjourney-docs
AWS_REGION=eu-west-1

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password

FRONTEND_URL=http://localhost:3000
```

---

## Estructura del Proyecto

```
backend/
├── src/
│   ├── app.js                    # Punto de entrada del servidor
│   ├── routes/                   # Definición de endpoints
│   │   ├── auth.routes.js        # /api/auth/*
│   │   ├── viajes.routes.js      # /api/viajes/*
│   │   ├── reservas.routes.js    # /api/reservas/*
│   │   ├── itinerarios.routes.js # /api/itinerarios/*
│   │   └── perfil.routes.js      # /api/perfil/*
│   ├── controllers/              # Lógica de cada endpoint
│   │   ├── auth.controller.js
│   │   ├── viajes.controller.js
│   │   ├── reservas.controller.js
│   │   ├── itinerarios.controller.js
│   │   └── perfil.controller.js
│   ├── services/                 # Lógica de negocio reutilizable
│   │   ├── ia.service.js         # Comunicación con Gemini API
│   │   ├── stripe.service.js     # Procesamiento de pagos
│   │   ├── email.service.js      # Envío de emails
│   │   └── revelacion.service.js # Timer automático 48h
│   ├── models/                   # Queries SQL (acceso a BD)
│   │   ├── usuario.model.js
│   │   ├── viaje.model.js
│   │   ├── reserva.model.js
│   │   ├── itinerario.model.js
│   │   └── notificacion.model.js
│   ├── middlewares/              # Funciones intermedias
│   │   ├── auth.middleware.js    # Verificación JWT
│   │   └── validacion.middleware.js # Validación de inputs
│   └── config/
│       └── db.js                 # Conexión a MySQL
└── package.json
```

---

## Endpoints principales

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | /api/auth/registro | Crear cuenta | No |
| POST | /api/auth/login | Iniciar sesión | No |
| POST | /api/auth/logout | Cerrar sesión | Sí |
| GET | /api/viajes | Mis viajes | Sí |
| POST | /api/viajes | Crear viaje | Sí |
| GET | /api/viajes/:id/destinos | Ver candidatos | Sí |
| POST | /api/viajes/:id/veto | Vetar destino | Sí |
| POST | /api/reservas | Confirmar reserva | Sí |
| POST | /api/itinerarios/generar | Generar con IA | Sí |
| GET | /api/viajes/:id/destino | Ver destino revelado | Sí |

---

## Decisiones técnicas destacadas

- **JWT stateless**: el servidor no almacena sesiones. El refresh token sí se guarda en BD para poder invalidarlo en el logout.
- **Passwords con bcrypt**: coste 12. Nunca se almacenan en texto plano.
- **Timer de revelación**: `setInterval` cada 60s comprueba si hay viajes a revelar. Se ejecuta en el mismo proceso del servidor.
- **Destino protegido**: el campo `destino_id` nunca se devuelve al frontend hasta que `estado = 'revelado'`.

---

## Tests

```bash
npm test
```

Los tests usan Jest + Supertest para probar los endpoints de forma aislada (sin base de datos real, usando mocks).
