# BlindJourney

**Autora:** Alicia Maillo Sánchez  
**Proyecto intermodular individual**  
**Stack:** Node.js · Express · MySQL · Sequelize · JWT · Stripe · Google Gemini · Jest

---

## Descripción

BlindJourney es una plataforma SaaS de viajes sorpresa. El usuario no conoce su destino hasta 48 horas antes de la salida. La inteligencia artificial (Google Gemini) genera candidatos de destino personalizados según el perfil del viajero y, una vez revelado el destino, crea un itinerario día a día adaptado a sus intereses.

---

## Estructura del repositorio

```
BlindJourney/
├── backend/               # API REST (Node.js + Express)
│   ├── src/
│   │   ├── app.js         # Punto de entrada del servidor
│   │   ├── create-app.js  # Factory sin listen() (para tests)
│   │   ├── config/        # Conexión Sequelize
│   │   ├── models/        # Modelos Sequelize
│   │   ├── controllers/   # Controladores
│   │   ├── services/      # Gemini, Stripe, Email, Revelación, Normalización
│   │   ├── routes/        # Grupos de rutas
│   │   ├── middlewares/   # JWT auth + validación de inputs
│   │   └── public/        # HTML tester manual de la API
│   ├── tests/             # Tests Jest + Supertest
│   └── .env.example       # Variables de entorno documentadas
└── bbdd/
    ├── blindjourney_estructura_y_datos.sql   # Esquema completo + datos de prueba
    └── blindjourney_esquema_bbdd.png         # Diagrama entidad-relación
```

---

## Flujo principal

```
1. POST /api/auth/registro     → crea cuenta + envía email de verificación
2. POST /api/auth/login        → devuelve JWT (24h) + refresh token (7d)

3. POST /api/viajes            → crea viaje + llama a Gemini
                                  → guarda 10-12 candidatos de destino en BD

4. POST /api/viajes/:id/candidatos/:candidatoId/vetar
                               → marca candidato como vetado

5. POST /api/reservas          → selecciona candidato no vetado aleatorio
                                  → crea PaymentIntent en Stripe
                                  → guarda reserva en estado 'pendiente'

6. POST /api/reservas/webhook  → Stripe confirma pago
                                  → viaje.estado = 'confirmado'

7. Timer (cada 60s)            → si fecha_revelacion ≤ now
   o PATCH /api/viajes/:id/revelar → viaje.estado = 'revelado'
                                  → destino_revelado = true
                                  → envía email de revelación al usuario

8. POST /api/itinerarios/viaje/:id/regenerar
                               → llama a Gemini con destino, perfil y duración
                               → genera y guarda actividades día a día
```

---

## Endpoints

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| POST | /api/auth/registro | No | Crear cuenta |
| POST | /api/auth/login | No | Iniciar sesión (devuelve JWT) |
| POST | /api/auth/logout | Sí | Revocar refresh token |
| GET | /api/auth/verificar/:token | No | Verificar email |
| POST | /api/auth/recuperar-password | No | Solicitar reset de contraseña |
| POST | /api/auth/nueva-password | No | Establecer nueva contraseña |
| POST | /api/auth/refresh | No | Renovar JWT con refresh token |

### Viajes

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | /api/viajes | Sí | Listar viajes del usuario |
| POST | /api/viajes | Sí | Crear viaje + generar candidatos IA |
| GET | /api/viajes/:id | Sí | Obtener viaje con candidatos |
| PATCH | /api/viajes/:id/revelar | Sí | Revelar destino manualmente |
| POST | /api/viajes/:id/candidatos/:cId/vetar | Sí | Vetar candidato de destino |

### Reservas

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | /api/reservas | Sí | Listar reservas del usuario |
| POST | /api/reservas | Sí | Crear reserva + PaymentIntent Stripe |
| PATCH | /api/reservas/:id/cancelar | Sí | Cancelar reserva |
| POST | /api/reservas/webhook | No | Webhook de Stripe (raw body) |

### Itinerarios

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | /api/itinerarios/viaje/:id | Sí | Obtener itinerario de un viaje |
| POST | /api/itinerarios/viaje/:id/regenerar | Sí | Regenerar itinerario con IA |

### Perfil

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | /api/perfil/me | Sí | Obtener perfil del usuario autenticado |
| PUT | /api/perfil/me | Sí | Actualizar preferencias del perfil |

### Álbum de fotos

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | /api/fotos/viaje/:id | Sí | Listar fotos del álbum de un viaje |
| POST | /api/fotos/viaje/:id | Sí | Subir foto al álbum |
| DELETE | /api/fotos/:id | Sí | Eliminar foto |

### Documentos

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | /api/documentos | Sí | Listar todos los documentos del usuario |
| GET | /api/documentos/viaje/:id | Sí | Listar documentos de un viaje |
| POST | /api/documentos | Sí | Crear documento |
| PUT | /api/documentos/:id | Sí | Actualizar documento |
| DELETE | /api/documentos/:id | Sí | Eliminar documento |

### Buscador (afiliados)

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | /api/buscador/links | Sí | Obtener links de vuelos y hoteles (afiliados) |
| POST | /api/buscador/registrar | Sí | Registrar clic de afiliado |
| GET | /api/buscador/estadisticas | Sí | Ver estadísticas de comisiones |

### Notificaciones

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | /api/notificaciones | Sí | Listar notificaciones del usuario |
| PATCH | /api/notificaciones/leer-todas | Sí | Marcar todas como leídas |
| PATCH | /api/notificaciones/:id/leer | Sí | Marcar una notificación como leída |
| DELETE | /api/notificaciones/:id | Sí | Eliminar notificación |

### Sistema

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | /health | No | Health check del servidor |

---

## Instalación y arranque

### Requisitos
- Node.js 18+
- MySQL 8+

### 1. Base de datos local

El archivo [bbdd/blindjourney_estructura_y_datos.sql](bbdd/blindjourney_estructura_y_datos.sql) contiene el esquema completo y usuarios/datos de prueba listos para usar.

> **Contraseña de todos los usuarios de prueba:** `Test1234!`

El SQL usa `HASH_PENDIENTE` como marcador para los hashes bcrypt (no se guardan en texto plano). Antes de importar, genera el hash real:

```bash
# Desde la carpeta backend
node -e "require('bcryptjs').hash('Test1234!', 12).then(console.log)"
```

Copia el hash que devuelve, abre `bbdd/blindjourney_estructura_y_datos.sql` y reemplaza las **3 ocurrencias** de `HASH_PENDIENTE` con ese valor. Luego importa:

```bash
# Opción A – línea de comandos
mysql -u root -p < bbdd/blindjourney_estructura_y_datos.sql

# Opción B – DBeaver / TablePlus / MySQL Workbench
# Abre el archivo .sql y ejecútalo directamente
```

El diagrama entidad-relación está en [bbdd/blindjourney_esquema_bbdd.png](bbdd/blindjourney_esquema_bbdd.png).

---

### 2. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (DB, JWT, Stripe, Gemini, Email)

# Arrancar en modo desarrollo (nodemon)
npm run dev

# Ejecutar tests
npm test
```

### Variables de entorno (`.env`)

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=blindjourney
DB_USER=root
DB_PASSWORD=tu_password

JWT_SECRET=clave_muy_larga_y_aleatoria
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

GEMINI_API_KEY=...
GROQ_API_KEY=...          # fallback gratuito si Gemini falla

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_FROM="BlindJourney" <noreply@blindjourney.com>

FRONTEND_URL=http://localhost:3000
```

Consulta `backend/.env.example` para el detalle completo y cómo obtener cada clave.

---

## Decisiones técnicas destacadas

- **JWT stateless + refresh token en BD**: el refresh token se persiste para poder revocarlo en logout; el JWT de acceso (24h) no se almacena.
- **Destino protegido**: `destino_ciudad` y `destino_pais` no se exponen en ninguna respuesta hasta que `destino_revelado = true`.
- **Graceful degradation en IA**: si Gemini falla (sin API key, cuota agotada), el sistema intenta Groq como fallback; si ambos fallan, el viaje se crea igualmente sin candidatos.
- **Timer en proceso**: el servicio de revelación usa `setInterval` cada 60s dentro del proceso principal; en producción se podría migrar a un job externo (cron, AWS Lambda).
- **Separación app / server**: `create-app.js` monta las rutas sin arrancar el servidor, lo que permite testear con Supertest sin efectos secundarios.
