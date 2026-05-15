// ============================================================
// BlindJourney – Componente de Ruta Protegida
// Autora: Alicia Maillo
//
// Este componente es un "guard" que protege rutas privadas.
// Si el usuario no tiene token (no está autenticado), lo redirige a /login.
// Si tiene token, renderiza las rutas hijas mediante <Outlet />.
//
// Patrón React Router v6: en main.jsx, se envuelven rutas privadas
// en <ProtectedRoute> como elemento padre con children dentro.
// ============================================================

// Navigate: redirige a otra ruta
// Outlet: renderiza las rutas hijas (componentes dentro de ProtectedRoute)
import { Navigate, Outlet } from 'react-router-dom';
// Hook para acceder al contexto de autenticación (user, token, etc.)
import { useAuth } from '../context/AuthContext';

// ── COMPONENTE RUTA PROTEGIDA ──────────────────────────────
/**
 * Guard que verifica autenticación antes de mostrar rutas privadas.
 * Props: ninguna (recibe children implícitamente desde el router)
 *
 * Lógica:
 * - Si no hay token en localStorage → redirige a /login
 * - Si hay token → renderiza las rutas hijas (Outlet)
 *
 * Nota: replace en Navigate reemplaza el historial en lugar de agregarlo
 */
export default function ProtectedRoute() {
  // Lee el token del contexto de autenticación
  const { token } = useAuth();

  // Si no hay token, el usuario está sin autenticar
  // Navigate lo redirige a /login (replace evita volver atrás a rutas privadas)
  if (!token) return <Navigate to="/login" replace />;

  // Si hay token, renderiza las rutas hijas (ej. <Layout /> > <DashboardPage />)
  // <Outlet /> es un placeholder que React Router rellena con el componente de la ruta actual
  return <Outlet />;
}
