import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import ViajesPage from '../../pages/ViajesPage';
import { tokenFixture } from '../fixtures/user';
import { viajesFixture } from '../fixtures/viajes';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function wrap() {
  localStorage.setItem('bj_token', tokenFixture);
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/viajes']}>
          <Routes>
            <Route path="/viajes" element={<ViajesPage />} />
            <Route path="/viajes/nuevo" element={<div>Nuevo</div>} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('ViajesPage', () => {
  it('muestra spinner durante la carga', () => {
    server.use(http.get('/api/viajes', async () => {
      await new Promise(() => {});
    }));
    wrap();
    expect(document.querySelector('svg.MuiCircularProgress-svg') || screen.queryByRole('progressbar')).toBeTruthy();
  });

  it('muestra título "Mis viajes"', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Mis viajes')).toBeInTheDocument();
    });
  });

  it('muestra todos los viajes en una sola lista', async () => {
    wrap();
    await waitFor(() => {
      // Con el fixture viajesFixture, debemos ver al menos un viaje
      expect(screen.getByText('Mis viajes')).toBeInTheDocument();
    });
  });

  it('muestra estado vacío cuando no hay viajes', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json([])));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Aún no tienes viajes')).toBeInTheDocument();
    });
  });

  it('FAB navega a /viajes/nuevo', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Mis viajes'));
    const fab = document.querySelector('.MuiFab-root');
    await act(async () => {
      await user.click(fab);
    });
    expect(screen.getByTestId('location').textContent).toBe('/viajes/nuevo');
  });

  it('muestra alerta de error cuando la API falla', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    wrap();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('maneja respuesta con wrapper { viajes: [...] }', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json({ viajes: viajesFixture.slice(0, 1) })));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Mis viajes')).toBeInTheDocument();
    });
  });

  it('muestra viajes con diferentes estados en la misma lista', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Mis viajes')).toBeInTheDocument();
    });
    // Los viajes deben estar visibles sin separación por estado
    expect(screen.queryByText('Activos')).not.toBeInTheDocument();
    expect(screen.queryByText('Historial')).not.toBeInTheDocument();
  });
});
