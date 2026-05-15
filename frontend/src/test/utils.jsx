// ============================================================
// BlindJourney – Utilidades para Tests
// Autora: Alicia Maillo
//
// Proporciona helpers para renderizar componentes en tests
// con todos los proveedores (contextos, router, tema, i18n) que necesitan.
//
// Sin estos helpers, cada test tendría que envolver manualmente
// sus componentes en AppThemeProvider > LocalizationProvider > AuthProvider,
// lo que resultaría en código repetitivo y propenso a errores.
//
// Funciones exportadas:
// 1. renderWithProviders: renderiza un componente con todos los contextos
// 2. renderRoute: renderiza un componente como si fuera una ruta
// 3. setAuthInLocalStorage: configura autenticación inicial para tests
// ============================================================

import React from 'react';
// render: función de testing-library para renderizar componentes
import { render } from '@testing-library/react';
// MemoryRouter: enrutador en memoria (sin URL real del navegador)
// Routes, Route: para renderizar rutas en tests
import { MemoryRouter, Routes, Route } from 'react-router-dom';
// Date picker provider
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// Contextos globales
import { AppThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';

// ── COMPONENTE: Todos los Proveedores Envueltos ─────────
/**
 * Componente que envuelve children en TODOS los contextos necesarios.
 * Props:
 * - children: componente a renderizar
 * - initialEntries: rutas iniciales para MemoryRouter (default: ['/'])
 *
 * Orden de nesting (de dentro hacia fuera):
 * AppThemeProvider > LocalizationProvider > AuthProvider > MemoryRouter
 *
 * Esta es la misma estructura que en main.jsx, pero con MemoryRouter
 * en lugar de BrowserRouter (para tests sin navegador real)
 */
function AllProviders({ children, initialEntries = ['/'] }) {
  return (
    <AppThemeProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </AuthProvider>
      </LocalizationProvider>
    </AppThemeProvider>
  );
}

export function renderWithProviders(ui, { initialEntries = ['/'], ...options } = {}) {
  return render(
    <AllProviders initialEntries={initialEntries}>{ui}</AllProviders>,
    options
  );
}

export function renderRoute(element, path, url = path) {
  return render(
    <AppThemeProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <AuthProvider>
          <MemoryRouter initialEntries={[url]}>
            <Routes>
              <Route path={path} element={element} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </LocalizationProvider>
    </AppThemeProvider>
  );
}

export function setAuthInLocalStorage(token = 'test-token', user = { id: 1, nombre: 'Ana', apellidos: 'García', email: 'ana@test.com' }) {
  localStorage.setItem('bj_token', token);
  localStorage.setItem('bj_refresh', 'test-refresh-token');
  localStorage.setItem('bj_user', JSON.stringify(user));
}
