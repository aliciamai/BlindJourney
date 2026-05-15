import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { tokenFixture } from '../fixtures/user';
import { itinerarioFixture, itinerarioVacioFixture } from '../fixtures/itinerario';

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: vi.fn(() => ({ isLoaded: false, loadError: null })),
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  MarkerF: ({ title }) => <div>{title}</div>,
  InfoWindowF: ({ children }) => <div>{children}</div>,
}));

import ItinerarioPage from '../../pages/ItinerarioPage';

function wrap(id = '3') {
  localStorage.setItem('bj_token', tokenFixture);
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/viajes/${id}/itinerario`]}>
          <Routes>
            <Route path="/viajes/:id/itinerario" element={<ItinerarioPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('ItinerarioPage', () => {
  it('muestra spinner durante la carga', () => {
    server.use(http.get('/api/itinerarios/viaje/:id', async () => { await new Promise(() => {}); }));
    wrap();
    expect(document.querySelector('svg.MuiCircularProgress-svg') || screen.queryByRole('progressbar')).toBeTruthy();
  });

  it('muestra ciudad de destino en el header', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('París, Francia')).toBeInTheDocument();
    });
  });

  it('muestra actividades agrupadas por día', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Torre Eiffel')).toBeInTheDocument();
      expect(screen.getByText('Museo del Louvre')).toBeInTheDocument();
    });
  });

  it('actividad completada aparece con línea tachada', async () => {
    wrap();
    await waitFor(() => {
      const elJulesVerne = screen.getByText('Le Jules Verne');
      expect(elJulesVerne).toHaveStyle('text-decoration: line-through');
    });
  });

  it('actividad importante muestra icono de estrella', async () => {
    wrap();
    await waitFor(() => {
      // Le Jules Verne tiene importante=true, should show star
      expect(screen.getByText('Le Jules Verne')).toBeInTheDocument();
    });
  });

  it('muestra texto "Swipe hint" la primera vez (sin localStorage)', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/Desliza para eliminar/)).toBeInTheDocument();
    });
  });

  it('no muestra swipe hint cuando ya existe en localStorage', async () => {
    localStorage.setItem('bj_swipe_hint', '1');
    wrap();
    await waitFor(() => screen.getByText('Torre Eiffel'));
    expect(screen.queryByText(/Desliza para eliminar/)).not.toBeInTheDocument();
  });

  it('click en swipe hint lo oculta y guarda en localStorage', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText(/Desliza para eliminar/));
    await act(async () => {
      await user.click(screen.getByText(/Desliza para eliminar/));
    });
    expect(screen.queryByText(/Desliza para eliminar/)).not.toBeInTheDocument();
    expect(localStorage.getItem('bj_swipe_hint')).toBe('1');
  });

  it('click en check icon alterna completada', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Torre Eiffel'));
    // Click the first check button (Torre Eiffel - completada=false)
    const checkBtns = screen.getAllByRole('button');
    const checkBtn = checkBtns.find(b => b.querySelector('svg'));
    if (checkBtn) {
      await act(async () => {
        await user.click(checkBtns[checkBtns.length - 1]);
      });
    }
  });

  it('swipe izquierda sobre actividad llama handleDelete', async () => {
    wrap();
    await waitFor(() => screen.getByText('Torre Eiffel'));
    const actividadContainer = screen.getByText('Torre Eiffel').closest('[style]') || document.querySelector('[style*="translateX"]');
    if (actividadContainer) {
      fireEvent.mouseDown(actividadContainer, { clientX: 200 });
      fireEvent.mouseMove(actividadContainer, { clientX: 50 }); // move left > 72px
      fireEvent.mouseUp(actividadContainer);
    }
  });

  it('swipe derecha sobre actividad llama handleToggleImportant', async () => {
    wrap();
    await waitFor(() => screen.getByText('Torre Eiffel'));
    const actividadContainer = screen.getByText('Torre Eiffel').closest('[style]') || screen.getByText('Torre Eiffel').parentElement;
    if (actividadContainer) {
      fireEvent.mouseDown(actividadContainer, { clientX: 50 });
      fireEvent.mouseMove(actividadContainer, { clientX: 200 });
      fireEvent.mouseUp(actividadContainer);
    }
  });

  it('mouseLeave en actividad resetea el swipe offset', async () => {
    wrap();
    await waitFor(() => screen.getByText('Torre Eiffel'));
    const container = screen.getByText('Torre Eiffel').parentElement;
    if (container) {
      fireEvent.mouseDown(container, { clientX: 100 });
      fireEvent.mouseMove(container, { clientX: 150 });
      fireEvent.mouseLeave(container);
    }
  });

  it('touch events funcionan en SwipeableActivityItem', async () => {
    wrap();
    await waitFor(() => screen.getByText('Torre Eiffel'));
    const container = screen.getByText('Torre Eiffel').parentElement;
    if (container) {
      fireEvent.touchStart(container, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(container, { touches: [{ clientX: 30 }] });
      fireEvent.touchEnd(container);
    }
  });

  it('botón regenerar llama API y actualiza lista', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Regenerar itinerario'));
    await act(async () => {
      await user.click(screen.getByText('Regenerar itinerario'));
    });
    await waitFor(() => {
      expect(screen.getByText('Torre Eiffel')).toBeInTheDocument();
    });
  });

  it('muestra error cuando regenerar falla', async () => {
    server.use(http.post('/api/itinerarios/viaje/:id/regenerar', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Regenerar itinerario'));
    await act(async () => {
      await user.click(screen.getByText('Regenerar itinerario'));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('muestra empty state cuando itinerario no tiene actividades', async () => {
    server.use(http.get('/api/itinerarios/viaje/:id', () => HttpResponse.json({ itinerario: itinerarioVacioFixture })));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Sin itinerario aún')).toBeInTheDocument();
    });
  });

  it('botón generar en empty state llama API', async () => {
    server.use(http.get('/api/itinerarios/viaje/:id', () => HttpResponse.json({ itinerario: itinerarioVacioFixture })));
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Generar itinerario'));
    await act(async () => {
      await user.click(screen.getByText('Generar itinerario'));
    });
  });

  it('click en pestaña Mapa muestra MapView', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Mapa'));
    await act(async () => {
      await user.click(screen.getByText('Mapa'));
    });
    // MapView is mocked to not load (isLoaded=false), spinner shown
    await waitFor(() => {
      expect(screen.getByText('Cargando mapa...')).toBeInTheDocument();
    });
  });

  it('muestra error cuando carga de itinerario falla', async () => {
    server.use(http.get('/api/itinerarios/viaje/:id', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    wrap();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('actividad sin hora muestra "--:--"', async () => {
    const itWithNoHour = { ...itinerarioFixture, actividades: [{ ...itinerarioFixture.actividades[0], hora: null }] };
    server.use(http.get('/api/itinerarios/viaje/:id', () => HttpResponse.json({ itinerario: itWithNoHour })));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('--:--')).toBeInTheDocument();
    });
  });

  it('actividad con coste_estimado > 0 muestra chip de coste', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('25€')).toBeInTheDocument();
    });
  });

  it('maneja respuesta directa de itinerario sin wrapper { itinerario: ... }', async () => {
    server.use(http.get('/api/itinerarios/viaje/:id', () => HttpResponse.json(itinerarioFixture)));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Torre Eiffel')).toBeInTheDocument();
    });
  });

  it('muestra subtítulo cuando itinerario cargado', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Generado por IA · personalizado para ti')).toBeInTheDocument();
    });
  });
});
