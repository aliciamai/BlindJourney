// ============================================================
// BlindJourney – Punto de entrada React y configuración de rutas
// Autora: Alicia Maillo
//
// Este archivo define:
// 1. El árbol completo de rutas con createBrowserRouter
// 2. Todos los proveedores globales (tema, autenticación, i18n)
// 3. La estructura de la aplicación (rutas públicas, protegidas, layout)
//
// Orden de proveedores (de dentro hacia fuera):
// AppThemeProvider > LocalizationProvider > AuthProvider > RouterProvider
// Esto garantiza que todas las páginas tengan acceso a tema, idioma y autenticación.
// ============================================================

// React: librería principal para construir interfaces de usuario
import React from 'react';
// ReactDOM: monta la aplicación React en el DOM
import ReactDOM from 'react-dom/client';
// createBrowserRouter: router moderno basado en objetos de configuración
// Navigate: componente para redirigir a otra ruta
// ScrollRestoration: restaura la posición de scroll al navegar hacia atrás
import { createBrowserRouter, RouterProvider, Navigate, ScrollRestoration } from 'react-router-dom';
// LocalizationProvider: provee configuración de fechas/horas a componentes MUI
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// AdapterDayjs: adaptador que conecta dayjs con los date pickers de MUI
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// Locale de dayjs en español: necesario para que los date pickers muestren meses y días en español
import 'dayjs/locale/es';

// i18next: inicialización de internacionalización (carga archivos es.json y en.json)
import './i18n/index.js';
// Contextos que proveen funcionalidad global a toda la app
import { AppThemeProvider } from './context/ThemeContext';  // Gestiona tema dark/light
import { AuthProvider } from './context/AuthContext';        // Gestiona autenticación y JWT
// Componentes base de la aplicación
import ProtectedRoute from './components/ProtectedRoute';  // Guard que redirige a /login si no hay token
import Layout from './components/Layout';                  // Shell principal: top bar + bottom nav

// Importación de todas las páginas de la aplicación
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ViajesPage from './pages/ViajesPage';
import NuevoViajePage from './pages/NuevoViajePage';
import ViajeDetallePage from './pages/ViajeDetallePage';
import ItinerarioPage from './pages/ItinerarioPage';
import PerfilPage from './pages/PerfilPage';
import DocumentosPage from './pages/DocumentosPage';
import AlbumPage from './pages/AlbumPage';
import BuscadorPage from './pages/BuscadorPage';
import NotFoundPage from './pages/NotFoundPage';

// ── LAYOUT WRAPPER ───────────────────────────────────────────
/**
 * Componente envoltorio que añade ScrollRestoration al Layout.
 * ScrollRestoration restablece automáticamente la posición de scroll
 * cuando el usuario navega hacia atrás en el historial del navegador.
 * Props: ninguna
 */
function AppLayout() {
  return (
    <>
      <ScrollRestoration />
      <Layout />
    </>
  );
}

// ── CONFIGURACIÓN DE RUTAS ──────────────────────────────────────
/**
 * Árbol de rutas de la aplicación.
 *
 * Estructura:
 * - /login, /registro: públicas (sin Layout)
 * - /dashboard, /viajes, etc.: protegidas (dentro de ProtectedRoute + AppLayout)
 *   - ProtectedRoute redirige a /login si no hay token en AuthContext
 *   - AppLayout envuelve todas las rutas protegidas con Layout (top bar + bottom nav)
 * - /viajes/:id, /viajes/:id/itinerario, etc.: rutas dinámicas por viaje
 * - *: catch-all → NotFoundPage (404)
 */
const router = createBrowserRouter([
  // Rutas públicas (accesibles sin autenticación)
  { path: '/login',    element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },

  // Rutas protegidas: envueltas en ProtectedRoute que redirige a /login si no hay token
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // La raíz (/) redirige a /dashboard
          { index: true,                         element: <Navigate to="/dashboard" replace /> },
          // Rutas principales de la app
          { path: '/dashboard',                  element: <DashboardPage /> },
          { path: '/viajes',                     element: <ViajesPage /> },
          { path: '/viajes/nuevo',               element: <NuevoViajePage /> },
          // Rutas dinámicas: :id es reemplazado por el ID del viaje (ej. /viajes/123)
          { path: '/viajes/:id',                 element: <ViajeDetallePage /> },
          { path: '/viajes/:id/itinerario',      element: <ItinerarioPage /> },
          { path: '/viajes/:id/album',           element: <AlbumPage /> },
          // Otras rutas principales
          { path: '/buscador',                   element: <BuscadorPage /> },
          { path: '/perfil',                     element: <PerfilPage /> },
          { path: '/documentos',                 element: <DocumentosPage /> },
        ],
      },
    ],
  },
  // Catch-all: cualquier ruta no definida muestra la página 404
  { path: '*', element: <NotFoundPage /> },
]);

// ── RENDER DE LA APLICACIÓN ────────────────────────────────────
// Monta la aplicación React en el div#root del HTML con todos los proveedores globales.
// StrictMode: modo de desarrollo que avisa sobre potenciales problemas en React.
// Orden de proveedores (anidados de fuera hacia dentro):
// 1. AppThemeProvider: proporciona el contexto del tema (dark/light) a toda la app
// 2. LocalizationProvider: proporciona configuración de fechas en español a date pickers
// 3. AuthProvider: proporciona el contexto de autenticación (user, token, login/logout)
// 4. RouterProvider: proporciona el sistema de enrutamiento basado en el router definido arriba
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppThemeProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </LocalizationProvider>
    </AppThemeProvider>
  </React.StrictMode>
);
