import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import DashboardPage from '../../pages/DashboardPage';
import { userFixture, tokenFixture } from '../fixtures/user';
import { viajesFixture } from '../fixtures/viajes';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function wrap(user = userFixture) {
  localStorage.setItem('bj_token', tokenFixture);
  localStorage.setItem('bj_user', JSON.stringify(user));
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/perfil" element={<div>Perfil</div>} />
            <Route path="/viajes" element={<div>Viajes</div>} />
            <Route path="/viajes/:id" element={<div>Detalle</div>} />
            <Route path="/viajes/:id/itinerario" element={<div>Itinerario</div>} />
            <Route path="/viajes/nuevo" element={<div>Nuevo</div>} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('DashboardPage', () => {
  it('muestra spinner durante la carga', () => {
    server.use(http.get('/api/viajes', async () => {
      await new Promise(() => {}); // never resolves
    }));
    wrap();
    expect(document.querySelector('svg.MuiCircularProgress-svg') || screen.queryByRole('progressbar')).toBeTruthy();
  });

  it('muestra el nombre del usuario', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/Ana/)).toBeInTheDocument();
    });
  });

  it('muestra viaje próximo en modo sorpresa (pendiente)', async () => {
    wrap();
    await waitFor(() => {
      // Surprise mode shows a "Ver detalles" button, not the revealed destination
      expect(screen.getByText('Ver detalles')).toBeInTheDocument();
    });
  });

  it('muestra viaje revelado cuando destino_revelado=true', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json([viajesFixture[2]])));
    wrap();
    await waitFor(() => {
      // Revealed mode shows itinerary button instead of "Ver detalles"
      expect(screen.getByText(/Ver Itinerario/)).toBeInTheDocument();
    });
  });

  it('muestra estado vacío cuando no hay viajes', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json([])));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Sin viajes activos')).toBeInTheDocument();
    });
  });

  it('muestra historial de viajes (máx 3)', async () => {
    wrap();
    await waitFor(() => {
      // completado and cancelado appear in history
      expect(screen.getByText('Mis viajes')).toBeInTheDocument();
    });
  });

  it('click en avatar navega a /perfil', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText(/Ana/));
    // Avatar shows initials AG
    const avatar = screen.getByText('AG');
    await act(async () => {
      await user.click(avatar);
    });
    expect(screen.getByTestId('location').textContent).toBe('/perfil');
  });

  it('click en "Nuevo viaje sorpresa" navega a /viajes/nuevo', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Nuevo viaje sorpresa'));
    await act(async () => {
      await user.click(screen.getByText('Nuevo viaje sorpresa'));
    });
    expect(screen.getByTestId('location').textContent).toBe('/viajes/nuevo');
  });

  it('click "Ver todos" navega a /viajes', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Ver todos'));
    await act(async () => {
      await user.click(screen.getByText('Ver todos'));
    });
    expect(screen.getByTestId('location').textContent).toBe('/viajes');
  });

  it('click "Ver Itinerario" navega a itinerario del viaje revelado', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json([viajesFixture[2]])));
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText(/Ver Itinerario/));
    await act(async () => {
      await user.click(screen.getByText(/Ver Itinerario/));
    });
    expect(screen.getByTestId('location').textContent).toBe('/viajes/3/itinerario');
  });

  it('click "Ver detalles" navega al detalle del viaje no revelado', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Ver detalles'));
    await act(async () => {
      await user.click(screen.getByText('Ver detalles'));
    });
    expect(screen.getByTestId('location').textContent).toBe('/viajes/1');
  });

  it('maneja datos donde la API devuelve { viajes: [...] }', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json({ viajes: [] })));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Sin viajes activos')).toBeInTheDocument();
    });
  });

  it('muestra chip "Pendiente" para viaje pendiente', async () => {
    wrap();
    await waitFor(() => expect(screen.getByText('Pendiente')).toBeInTheDocument());
  });

  it('muestra chip "Confirmado" para viaje confirmado', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json([viajesFixture[1]])));
    wrap();
    await waitFor(() => expect(screen.getByText('Confirmado')).toBeInTheDocument());
  });

  it('muestra countdown cuando el viaje tiene revelar_en', async () => {
    wrap();
    await waitFor(() => screen.getByText('Días'));
    expect(screen.getByText('Días')).toBeInTheDocument();
  });

  it('usa nombre "Viajero" cuando user no tiene nombre', async () => {
    wrap({ id: 1, apellidos: '', email: 'x@x.com' });
    await waitFor(() => {
      expect(screen.getByText(/Viajero/)).toBeInTheDocument();
    });
  });

  it('maneja error en la carga de viajes sin romper la página', async () => {
    server.use(http.get('/api/viajes', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    wrap();
    await waitFor(() => {
      // Shows empty state
      expect(screen.getByText('Sin viajes activos')).toBeInTheDocument();
    });
  });
});
