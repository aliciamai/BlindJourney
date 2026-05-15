import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import NotFoundPage from '../../pages/NotFoundPage';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function wrap() {
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/not-found']}>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('NotFoundPage', () => {
  it('muestra el texto 404', () => {
    wrap();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('muestra el mensaje de página no encontrada', () => {
    wrap();
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });

  it('muestra la descripción', () => {
    wrap();
    expect(screen.getByText('Parece que esta aventura no existe')).toBeInTheDocument();
  });

  it('botón volver navega a /dashboard', async () => {
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Volver al inicio'));
    expect(screen.getByTestId('location').textContent).toBe('/dashboard');
  });
});
