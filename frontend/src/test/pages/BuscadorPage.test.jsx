import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import BuscadorPage from '../../pages/BuscadorPage';
import { tokenFixture } from '../fixtures/user';

function wrap(searchParams = '') {
  localStorage.setItem('bj_token', tokenFixture);
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/buscador${searchParams}`]}>
          <Routes>
            <Route path="/buscador" element={<BuscadorPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('BuscadorPage', () => {
  it('renderiza las 3 pestañas', async () => {
    wrap();
    expect(screen.getByText('Vuelos')).toBeInTheDocument();
    expect(screen.getByText('Hoteles')).toBeInTheDocument();
    expect(screen.getByText('Experiencias')).toBeInTheDocument();
  });

  it('carga estadísticas al montar', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Total: 5')).toBeInTheDocument();
    });
  });

  it('muestra campos de fecha e personas para vuelos', async () => {
    wrap();
    // MUI TextField renders label in both <label> and <legend>, use getAllByText
    expect(screen.getAllByText('Fecha ida').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Personas').length).toBeGreaterThan(0);
  });

  it('cambiar a pestaña Hoteles actualiza etiquetas de fecha', async () => {
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Hoteles'));
    expect(screen.getAllByText('Check-in').length).toBeGreaterThan(0);
  });

  it('cambiar a pestaña Experiencias oculta campos de fecha y personas', async () => {
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Experiencias'));
    expect(screen.queryByText('Fecha ida')).not.toBeInTheDocument();
    expect(screen.queryByText('Personas')).not.toBeInTheDocument();
  });

  it('buscar sin destino muestra error de validación', async () => {
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Buscar'));
    expect(screen.getByText('Introduce un destino')).toBeInTheDocument();
  });

  it('buscar con destino muestra resultados de proveedores (vuelos)', async () => {
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/destino/i), 'París');
    await act(async () => {
      await user.click(screen.getByText('Buscar'));
    });
    await waitFor(() => {
      expect(screen.getByText('Skyscanner')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('buscar hoteles muestra proveedores de hoteles', async () => {
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Hoteles'));
    await user.type(screen.getByLabelText(/destino/i), 'Londres');
    await act(async () => {
      await user.click(screen.getByText('Buscar'));
    });
    await waitFor(() => {
      expect(screen.getByText('Booking.com')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('buscar experiencias muestra proveedores de experiencias', async () => {
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Experiencias'));
    await user.type(screen.getByLabelText(/destino/i), 'Roma');
    await act(async () => {
      await user.click(screen.getByText('Buscar'));
    });
    await waitFor(() => {
      expect(screen.getByText('Viator')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('click en proveedor abre nueva ventana y registra búsqueda', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    wrap();
    await user.type(screen.getByLabelText(/destino/i), 'Madrid');
    await act(async () => {
      await user.click(screen.getByText('Buscar'));
    });
    await waitFor(() => screen.getByText('Skyscanner'), { timeout: 2000 });
    await act(async () => {
      await user.click(screen.getByText('Skyscanner'));
    });
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('proveedor abre ventana incluso si registrarBusqueda falla', async () => {
    server.use(http.post('/api/buscador/registrar', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    wrap();
    await user.type(screen.getByLabelText(/destino/i), 'Madrid');
    await act(async () => {
      await user.click(screen.getByText('Buscar'));
    });
    await waitFor(() => screen.getByText('Skyscanner'), { timeout: 2000 });
    await act(async () => {
      await user.click(screen.getByText('Skyscanner'));
    });
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('estadísticas no rompen si la API falla', async () => {
    server.use(http.get('/api/buscador/estadisticas', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    wrap();
    await waitFor(() => screen.getByText('Vuelos'));
    // No crash, stats section just not shown
    expect(screen.queryByText('Total:')).not.toBeInTheDocument();
  });

  it('carga destino desde searchParams', () => {
    wrap('?destino=Tokio');
    expect(screen.getByDisplayValue('Tokio')).toBeInTheDocument();
  });

  it('cambiar tab resetea resultados', async () => {
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/destino/i), 'Madrid');
    await act(async () => {
      await user.click(screen.getByText('Buscar'));
    });
    await waitFor(() => screen.getByText('Skyscanner'), { timeout: 2000 });
    await user.click(screen.getByText('Hoteles'));
    expect(screen.queryByText('Skyscanner')).not.toBeInTheDocument();
  });
});
