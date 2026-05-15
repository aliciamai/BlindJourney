// ============================================================
// BlindJourney – Contexto de Autenticación
// Autora: Alicia Maillo
//
// Gestiona el estado global de autenticación de la aplicación.
// Proporciona acceso a:
// - user: datos del usuario autenticado (nombre, email)
// - token: JWT actual (Bearer token)
// - Funciones: login, logout, refreshAuth, updateUser
//
// Persiste el token y los datos del usuario en localStorage para que
// sobrevivan a recargas de página. El JWT se renueva automáticamente
// mediante un interceptor en api/client.js cuando expira.
// ============================================================

// React Context API: proporciona acceso a datos sin prop drilling
// useState: guarda el estado local del usuario y token
import { createContext, useContext, useState } from 'react';
// Funciones para llamar a los endpoints de autenticación
import { loginApi, logoutApi, refreshTokenApi } from '../api/auth';

// Contexto que guardará el estado global de autenticación
// Inicializado con null (sin usuario ni token)
const AuthContext = createContext(null);

// ── PROVEEDOR DE AUTENTICACIÓN ───────────────────────────────
/**
 * Componente que proporciona autenticación global a toda la app.
 * Props: children (componentes que necesitan acceso a autenticación)
 *
 * Flujo:
 * 1. Lee el token y usuario desde localStorage al montar (para persistir login)
 * 2. Al hacer login, guarda token, refreshToken y user en localStorage y en estado
 * 3. Al hacer logout, borra todo
 * 4. refreshAuth intenta renovar el token antes de que expire
 */
export function AuthProvider({ children }) {
  // ── ESTADO INICIAL ──────────────────────────────────────────
  // useState(() => {...}) es una función inicializadora: solo se ejecuta una vez al montar
  // Esto evita llamar a localStorage en cada render (optimización)

  // user: datos del usuario (nombre, email, etc.) o null si no está autenticado
  const [user, setUser] = useState(() => {
    try {
      // Intenta leer 'bj_user' del localStorage (guardado como string JSON)
      const stored = localStorage.getItem('bj_user');
      // JSON.parse convierte la cadena JSON de vuelta a un objeto JavaScript
      return stored ? JSON.parse(stored) : null;
    } catch {
      // Si hay error al parsear (JSON inválido), devuelve null para evitar crashes
      return null;
    }
  });

  // token: JWT del usuario (cadena que se envía en cada request autorizado)
  // Se guarda con clave 'bj_token' en localStorage
  const [token, setToken] = useState(() => localStorage.getItem('bj_token') || null);

  // ── LOGIN ──────────────────────────────────────────────────
  /**
   * Autentica un usuario con email y contraseña.
   * Guarda el JWT y los datos del usuario en estado y localStorage.
   * Pasos:
   * 1. Llama a loginApi(email, password) en el backend
   * 2. Backend devuelve token (JWT de acceso), refreshToken (para renovar), y usuario
   * 3. Guarda todo en estado y localStorage para persistencia
   * 4. El token se incluirá automáticamente en futuras requests (interceptor en client.js)
   */
  const login = async (email, password) => {
    // Llama al endpoint POST /api/auth/login
    const data = await loginApi(email, password);
    // Actualiza el estado de React (para que componentes se re-rendericen)
    setToken(data.token);
    setUser(data.usuario);
    // Persiste en localStorage para sobrevivir recargas de página
    localStorage.setItem('bj_token', data.token);
    localStorage.setItem('bj_refresh', data.refreshToken);  // Se usa para renovar el JWT cuando expira
    localStorage.setItem('bj_user', JSON.stringify(data.usuario));
    return data;
  };

  // ── LOGOUT ─────────────────────────────────────────────────
  /**
   * Cierra la sesión del usuario.
   * Borra el token y usuario del estado y localStorage.
   * Notifica al backend (llamada a logoutApi con el refreshToken).
   * Si la llamada al servidor falla, continúa el logout local igual.
   */
  const logout = async () => {
    try {
      // Intenta notificar al backend que estamos haciendo logout
      // Esto permite al servidor invalidar el refreshToken en su BD
      const refreshToken = localStorage.getItem('bj_refresh');
      if (refreshToken) await logoutApi(refreshToken);
    } catch {
      // Si falla la llamada al servidor, continuamos con el logout local igual
      // El usuario se desconectará aunque el servidor no responda
    }
    // Limpia el estado de React
    setToken(null);
    setUser(null);
    // Borra todo de localStorage
    localStorage.removeItem('bj_token');
    localStorage.removeItem('bj_refresh');
    localStorage.removeItem('bj_user');
  };

  // ── RENOVAR AUTENTICACIÓN ──────────────────────────────────
  /**
   * Renueva el JWT cuando está próximo a expirar.
   * Pasos:
   * 1. Lee el refreshToken del localStorage
   * 2. Llama a refreshTokenApi(refreshToken) en el backend
   * 3. Backend devuelve un nuevo JWT
   * 4. Si falla, hace logout (token y refreshToken están corrompidos)
   *
   * Nota: Esta función se llama automáticamente desde el interceptor
   * en api/client.js cuando recibe un 401 (token expirado).
   */
  const refreshAuth = async () => {
    // Recupera el refreshToken (válido por más tiempo que el JWT de acceso)
    const refreshToken = localStorage.getItem('bj_refresh');
    // Si no existe, no podemos renovar → devolvemos null
    if (!refreshToken) return null;
    try {
      // Llama a POST /api/auth/refresh con el refreshToken
      const data = await refreshTokenApi(refreshToken);
      // Actualiza el JWT de acceso
      setToken(data.token);
      localStorage.setItem('bj_token', data.token);
      return data.token;
    } catch {
      // Si el refresh falla (refreshToken expirado/revocado), desconecta al usuario
      logout();
      return null;
    }
  };

  // ── ACTUALIZAR DATOS DEL USUARIO ───────────────────────────
  /**
   * Actualiza los datos del usuario en estado y localStorage.
   * Se usa cuando el usuario cambia su perfil (nombre, preferencias, etc.).
   * Props: userData (objeto con los nuevos datos del usuario)
   */
  const updateUser = (userData) => {
    // Actualiza el estado de React (para que componentes vean los cambios)
    setUser(userData);
    // Persiste en localStorage
    localStorage.setItem('bj_user', JSON.stringify(userData));
  };

  // ── PROVISIÓN DEL CONTEXTO ────────────────────────────────
  // AuthContext.Provider expone todos los métodos y estado a los componentes hijos
  // Cuando alguno de los valores cambia, todos los componentes que usan useAuth()
  // se re-renderizan automáticamente (suscriptores al contexto)
  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── HOOK DE ACCESO ─────────────────────────────────────────
/**
 * Hook que devuelve el contexto de autenticación.
 * Se usa así en componentes:
 * const { user, token, login, logout } = useAuth();
 *
 * Si se llama desde un componente que no está envuelto en AuthProvider,
 * devolverá null (causando un error típicamente; usa React DevTools para verificar).
 */
export const useAuth = () => useContext(AuthContext);
