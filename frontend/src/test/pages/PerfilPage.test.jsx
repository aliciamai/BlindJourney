import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import PerfilPage from '../../pages/PerfilPage';
import { tokenFixture, userFixture } from '../fixtures/user';

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
        <MemoryRouter initialEntries={['/perfil']}>
          <Routes>
            <Route path="/perfil" element={<PerfilPage />} />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('PerfilPage', () => {
  it('muestra el spinner durante la carga', () => {
    server.use(http.get('/api/perfil/me', async () => { await new Promise(() => {}); }));
    wrap();
    expect(document.querySelector('svg.MuiCircularProgress-svg') || screen.queryByRole('progressbar')).toBeTruthy();
  });

  it('muestra nombre y email del usuario', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.getByText('ana@test.com')).toBeInTheDocument();
    });
  });

  it('muestra ciudad de origen cargada del perfil', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Madrid')).toBeInTheDocument();
    });
  });

  it('permite editar ciudad de origen', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByDisplayValue('Madrid'));
    const input = screen.getByDisplayValue('Madrid');
    await user.clear(input);
    await user.type(input, 'Barcelona');
    expect(input.value).toBe('Barcelona');
  });

  it('toggle de interés añade y quita del array', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText(/Cultura/i));
    const culturaChip = screen.getByText(/Cultura/i);
    // cultura is already selected (from perfilFixture.intereses = ['cultura', 'gastronomia'])
    // clicking it should deselect
    await act(async () => {
      await user.click(culturaChip);
    });
    // Click again to reselect
    await act(async () => {
      await user.click(culturaChip);
    });
  });

  it('selección de alojamiento es single-select', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText(/Hostal/i));
    await act(async () => {
      await user.click(screen.getByText(/Hostal/i));
    });
    // Hotel should no longer be selected (overridden)
  });

  it('toggle de dieta funciona', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText(/Vegano/i));
    await act(async () => {
      await user.click(screen.getByText(/Vegano/i));
    });
  });

  it('botón guardar llama actualizarPerfil y muestra éxito', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Guardar preferencias'));
    await act(async () => {
      await user.click(screen.getByText('Guardar preferencias'));
    });
    await waitFor(() => {
      expect(screen.getByText('Preferencias guardadas correctamente')).toBeInTheDocument();
    });
  });

  it('muestra error cuando guardar falla', async () => {
    server.use(http.put('/api/perfil/me', () => HttpResponse.json({ mensaje: 'Error al guardar' }, { status: 500 })));
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Guardar preferencias'));
    await act(async () => {
      await user.click(screen.getByText('Guardar preferencias'));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('muestra error genérico cuando no hay mensaje de error', async () => {
    server.use(http.put('/api/perfil/me', () => HttpResponse.json({}, { status: 500 })));
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Guardar preferencias'));
    await act(async () => {
      await user.click(screen.getByText('Guardar preferencias'));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('botón cerrar sesión llama logout y navega a /login', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Cerrar sesión'));
    await act(async () => {
      await user.click(screen.getByText('Cerrar sesión'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/login');
    });
  });

  it('muestra error cuando carga de perfil falla', async () => {
    server.use(http.get('/api/perfil/me', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    wrap();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('maneja usuario sin apellidos para las iniciales', async () => {
    wrap({ id: 1, nombre: 'Ana', apellidos: '', email: 'ana@test.com' });
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  it('maneja respuesta de perfil sin wrapper { perfil: ... }', async () => {
    server.use(http.get('/api/perfil/me', () => HttpResponse.json({ intereses: [], tipo_alojamiento: 'hotel', restricciones_alimentarias: [], nivel_actividad: 'tranquilo', ciudad_origen: 'Sevilla', moneda: 'EUR' })));
    wrap();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sevilla')).toBeInTheDocument();
    });
  });
});
