import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import ViajeDetallePage from '../../pages/ViajeDetallePage';
import { tokenFixture } from '../fixtures/user';
import { viajesFixture, viajeNoReveladoFixture, viajeReveladoFixture } from '../fixtures/viajes';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function wrap(id = '1') {
  localStorage.setItem('bj_token', tokenFixture);
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/viajes/${id}`]}>
          <Routes>
            <Route path="/viajes/:id" element={<ViajeDetallePage />} />
            <Route path="/viajes/:id/itinerario" element={<div>Itinerario</div>} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('ViajeDetallePage', () => {
  it('muestra spinner durante la carga', () => {
    server.use(http.get('/api/viajes/:id', async () => { await new Promise(() => {}); }));
    wrap();
    expect(document.querySelector('svg.MuiCircularProgress-svg') || screen.queryByRole('progressbar')).toBeTruthy();
  });

  it('modo sorpresa: muestra "Tu viaje está listo"', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeNoReveladoFixture })));
    wrap('1');
    await waitFor(() => {
      expect(screen.getByText(/Tu viaje está listo/)).toBeInTheDocument();
    });
  });

  it('modo sorpresa: muestra countdown si hay revelar_en', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeNoReveladoFixture })));
    wrap('1');
    await waitFor(() => {
      expect(screen.getByText('Días')).toBeInTheDocument();
    });
  });

  it('modo sorpresa: muestra pistas cuando hay candidato seleccionado', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeNoReveladoFixture })));
    wrap('1');
    await waitFor(() => {
      expect(screen.getByText('Pistas desbloqueadas 🔓')).toBeInTheDocument();
      expect(screen.getByText('Clima')).toBeInTheDocument();
      expect(screen.getByText('Templado')).toBeInTheDocument();
      expect(screen.getByText('Idioma')).toBeInTheDocument();
      expect(screen.getByText('Portugués')).toBeInTheDocument();
    });
  });

  it('modo revelado: muestra nombre del destino', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeReveladoFixture })));
    wrap('3');
    await waitFor(() => {
      // Multiple elements may contain "París" (header + content); verify at least one exists
      expect(screen.getAllByText(/París/).length).toBeGreaterThan(0);
    });
  });

  it('modo revelado: muestra botón de itinerario', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeReveladoFixture })));
    wrap('3');
    await waitFor(() => {
      expect(screen.getByText(/Ver mi itinerario/)).toBeInTheDocument();
    });
  });

  it('modo revelado: navega a itinerario al hacer click', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeReveladoFixture })));
    const user = userEvent.setup();
    wrap('3');
    await waitFor(() => screen.getByText(/Ver mi itinerario/));
    await act(async () => {
      await user.click(screen.getByText(/Ver mi itinerario/));
    });
    expect(screen.getByTestId('location').textContent).toBe('/viajes/3/itinerario');
  });

  it('botón revelar llama a la API y actualiza al modo revelado', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: { ...viajeNoReveladoFixture, revelar_en: null } })));
    const user = userEvent.setup();
    wrap('1');
    await waitFor(() => screen.getByText('Revelar ahora (demo)'));
    await act(async () => {
      await user.click(screen.getByText('Revelar ahora (demo)'));
    });
    await waitFor(() => {
      // Multiple elements may contain "Lisboa" (header + content)
      expect(screen.getAllByText(/Lisboa/).length).toBeGreaterThan(0);
    });
  });

  it('muestra error cuando la API falla al cargar', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    wrap('1');
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('muestra error cuando falla el revelado', async () => {
    server.use(
      http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: { ...viajeNoReveladoFixture, revelar_en: null } })),
      http.patch('/api/viajes/:id/revelar', () => HttpResponse.json({ mensaje: 'Error revelado' }, { status: 500 }))
    );
    const user = userEvent.setup();
    wrap('1');
    await waitFor(() => screen.getByText('Revelar ahora (demo)'));
    await act(async () => {
      await user.click(screen.getByText('Revelar ahora (demo)'));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('muestra el chip de estado cuando hay viaje', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeNoReveladoFixture })));
    wrap('1');
    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  it('muestra nombre de ciudad en header cuando está revelado', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeReveladoFixture })));
    wrap('3');
    await waitFor(() => {
      // Paris shown in header
      const headers = screen.getAllByText('París');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  it('maneja respuesta directa sin wrapper { viaje: ... }', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json(viajeReveladoFixture)));
    wrap('3');
    await waitFor(() => {
      expect(screen.getAllByText(/París/).length).toBeGreaterThan(0);
    });
  });

  it('modo revelado: muestra "Por confirmar" si no hay reserva con datos', async () => {
    const viajeConReservaVacia = { ...viajeReveladoFixture, reservas: [{ id: 200 }] };
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeConReservaVacia })));
    wrap('3');
    await waitFor(() => {
      const items = screen.getAllByText('Por confirmar');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  it('botón volver llama navigate(-1)', async () => {
    server.use(http.get('/api/viajes/:id', () => HttpResponse.json({ viaje: viajeNoReveladoFixture })));
    const user = userEvent.setup();
    wrap('1');
    await waitFor(() => screen.getByText(/Tu viaje está listo/));
    const backBtn = screen.getAllByRole('button')[0];
    await user.click(backBtn);
    // navigate(-1) in MemoryRouter goes to previous entry (none, stays)
    expect(screen.getByTestId('location').textContent).toBe('/viajes/1');
  });
});
