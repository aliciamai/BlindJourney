import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import LoginPage from '../../pages/LoginPage';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function wrap() {
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route path="/registro" element={<div>Registro</div>} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('LoginPage', () => {
  it('renderiza campos de email y contraseña', () => {
    wrap();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('toggle de visibilidad de contraseña cambia type del input', async () => {
    const user = userEvent.setup();
    wrap();
    const pwdInput = screen.getByLabelText(/contraseña/i);
    expect(pwdInput).toHaveAttribute('type', 'password');
    // Click the visibility icon button
    const toggleBtn = screen.getByRole('button', { name: '' });
    await user.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'text');
    await user.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'password');
  });

  it('submit correcto navega a /dashboard', async () => {
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/email/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password1');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    });
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/dashboard');
    });
  });

  it('muestra error cuando el login falla', async () => {
    server.use(http.post('/api/auth/login', () =>
      HttpResponse.json({ mensaje: 'Credenciales incorrectas' }, { status: 401 })
    ));
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('muestra error genérico cuando no hay mensaje de la API', async () => {
    server.use(http.post('/api/auth/login', () =>
      HttpResponse.json({}, { status: 401 })
    ));
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/email/i), 'x@x.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('botón "Crear una cuenta" navega a /registro', async () => {
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Crear una cuenta'));
    expect(screen.getByTestId('location').textContent).toBe('/registro');
  });
});
