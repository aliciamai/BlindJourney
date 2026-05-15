import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { AppThemeProvider } from '../../context/ThemeContext';
import ProtectedRoute from '../../components/ProtectedRoute';

function wrap(initialEntries, authLS = {}) {
  Object.entries(authLS).forEach(([k, v]) => localStorage.setItem(k, v));
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/login" element={<div>Login page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Dashboard page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('ProtectedRoute', () => {
  it('redirige a /login cuando no hay token', () => {
    wrap(['/dashboard']);
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('renderiza children (Outlet) cuando hay token', () => {
    wrap(['/dashboard'], { bj_token: 'test-token' });
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
