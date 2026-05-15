// ============================================================
// BlindJourney – Cliente HTTP Axios con Interceptores
// Autora: Alicia Maillo
//
// Este módulo crea una instancia de axios (librería HTTP) configurada
// para comunicarse con el backend en /api.
//
// Incluye dos interceptores importantes:
// 1. Request: añade el JWT al header Authorization de cada request
// 2. Response: maneja errores 401 renovando el JWT automáticamente
//
// Patrón: Todos los módulos de API importan este client, no axios directamente.
// ============================================================

// axios: librería para hacer requests HTTP (GET, POST, PUT, DELETE, PATCH)
// Es más cómoda que fetch porque:
// - Los interceptores simplifican la lógica de autenticación
// - Transforma automáticamente JSON
// - Mejor manejo de errores
import axios from 'axios';

// ── CONFIGURACIÓN DEL CLIENTE ──────────────────────────────────
/**
 * Instancia de axios configurada para el backend de BlindJourney.
 * baseURL: '/api' → todos los requests van a https://host/api/...
 * headers: content-type JSON → el backend espera JSON
 */
const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── INTERCEPTOR DE REQUEST ────────────────────────────────────
/**
 * Se ejecuta antes de enviar cada request.
 * Pasos:
 * 1. Lee el JWT del localStorage (guardado por AuthContext.login)
 * 2. Si existe, lo añade al header Authorization con formato "Bearer <token>"
 * 3. El backend lee el header y verifica que el token sea válido
 *
 * Formato HTTP:
 * Authorization: Bearer eyJhbGc...iOiJIUzI1NiJ9...
 *
 * Por qué Bearer: Es el estándar OAuth 2.0 para tokens JWT.
 * El servidor espera exactamente "Bearer <token>", no otro prefijo.
 */
client.interceptors.request.use((config) => {
  // Recupera el JWT de acceso desde localStorage
  const token = localStorage.getItem('bj_token');
  // Si el usuario está autenticado, añade el token al request
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Devuelve la configuración actualizada
  return config;
});

// ── INTERCEPTOR DE RESPONSE (Manejo de expiración de JWT) ──────────
/**
 * Se ejecuta después de recibir una respuesta del servidor.
 * Maneja automáticamente la renovación del JWT cuando expira (401).
 *
 * Flujo cuando el JWT expira:
 * 1. Backend devuelve 401 (Unauthorized)
 * 2. Este interceptor lo detecta
 * 3. Intenta renovar el JWT usando el refreshToken
 * 4. Si el refresh es exitoso, reintentar el request original con el nuevo JWT
 * 5. Si el refresh falla, limpia localStorage y redirige a /login
 *
 * Por qué esto es necesario:
 * - JWT de acceso: duración corta (24h) para seguridad
 * - refreshToken: duración larga (7 días) para no molestar al usuario
 * - Sin este interceptor, el usuario sería desconectado cada 24h
 */
client.interceptors.response.use(
  // Si la response es exitosa (2xx), la devuelve sin cambios
  (res) => res,

  // Si hay error, intenta manejar el caso específico del JWT expirado
  async (error) => {
    // error.config = configuración del request que falló (para reintentar)
    const original = error.config;

    // Detecta si es un error 401 (JWT expirado) y aún no hemos intentado refresh
    // original._retry: flag interno para prevenir reintentos infinitos
    // Situación: si el refresh también falla, no queremos intentar refresh+refresh+refresh...
    if (error.response?.status === 401 && !original._retry) {
      // Marca este request como "ya intentado refresh" para evitar bucle infinito
      original._retry = true;

      // Intenta renovar el JWT con el refreshToken
      const refreshToken = localStorage.getItem('bj_refresh');

      // Si existe un refreshToken, intenta usarlo
      if (refreshToken) {
        try {
          // Llama a POST /api/auth/refresh
          // Nota: usamos axios directo, no client, para evitar interceptores recursivos
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });

          // Si el refresh fue exitoso, actualiza el JWT
          localStorage.setItem('bj_token', data.token);

          // Añade el nuevo JWT al request original
          original.headers.Authorization = `Bearer ${data.token}`;

          // Reintenta el request original con el nuevo JWT
          // client(original) es equivalente a client.get/post/etc con la config original
          return client(original);
        } catch {
          // Si el refresh falla (refreshToken expirado/revocado en el servidor):
          // Limpia la autenticación local y redirige al login
          localStorage.removeItem('bj_token');
          localStorage.removeItem('bj_refresh');
          localStorage.removeItem('bj_user');
          // Redirige al login (el usuario tendrá que hacer login de nuevo)
          window.location.href = '/login';
        }
      }
    }

    // Si no es un 401 o ya intentamos refresh, rechaza el error
    // El componente que hizo el request verá el error en el catch
    return Promise.reject(error);
  }
);

// Exporta el cliente configurado para que otros módulos de API lo usen
export default client;
