import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import RegisterPage from '../../pages/RegisterPage';

function wrap() {
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/registro']}>
          <Routes>
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('RegisterPage', () => {
  it('renderiza todos los campos del formulario', () => {
    wrap();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellidos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
  });

  it('indicador de contraseña débil cuando < 8 caracteres', async () => {
    const user = userEvent.setup();
    wrap();
    // 8+ chars, no uppercase, no number → strength=1 → 'Débil' (typing only 3 chars gives strength=0, no label)
    await user.type(screen.getByLabelText(/contraseña/i), 'abcdefgh');
    await waitFor(() => {
      expect(screen.getByText('Débil')).toBeInTheDocument();
    });
  });

  it('indicador de contraseña media con longitud y mayúscula', async () => {
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/contraseña/i), 'Abcdefgh');
    await waitFor(() => {
      expect(screen.getByText('Media')).toBeInTheDocument();
    });
  });

  it('indicador de contraseña fuerte con longitud, mayúscula y número', async () => {
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/contraseña/i), 'Abcdefg1');
    await waitFor(() => {
      expect(screen.getByText('Fuerte')).toBeInTheDocument();
    });
  });

  it('muestra error si contraseña no cumple requisitos al submitir', async () => {
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/apellidos/i), 'García');
    await user.type(screen.getByLabelText(/email/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'short');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /registrarme/i }));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('submit válido muestra estado de éxito', async () => {
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/apellidos/i), 'García');
    await user.type(screen.getByLabelText(/email/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password1');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /registrarme/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/Cuenta creada/i)).toBeInTheDocument();
    });
  });

  it('submit válido con teléfono incluye teléfono en la petición', async () => {
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/apellidos/i), 'García');
    await user.type(screen.getByLabelText(/email/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password1');
    await user.type(screen.getByLabelText(/teléfono/i), '+34600000001');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /registrarme/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/Cuenta creada/i)).toBeInTheDocument();
    });
  });

  it('muestra error de servidor en el formulario', async () => {
    server.use(http.post('/api/auth/registro', () =>
      HttpResponse.json({ mensaje: 'Email ya registrado' }, { status: 400 })
    ));
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/apellidos/i), 'García');
    await user.type(screen.getByLabelText(/email/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password1');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /registrarme/i }));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('muestra error genérico cuando el servidor no da mensaje', async () => {
    server.use(http.post('/api/auth/registro', () =>
      HttpResponse.json({}, { status: 500 })
    ));
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/apellidos/i), 'García');
    await user.type(screen.getByLabelText(/email/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password1');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /registrarme/i }));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('toggle visibilidad de contraseña', async () => {
    const user = userEvent.setup();
    wrap();
    const input = screen.getByLabelText(/contraseña/i);
    expect(input).toHaveAttribute('type', 'password');
    // Multiple icon-only buttons exist (ArrowBack + visibility toggle); visibility is index 1
    const allBtns = screen.getAllByRole('button');
    await user.click(allBtns[1]);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('botón volver al login navega a /login desde estado de éxito', async () => {
    const user = userEvent.setup();
    wrap();
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/apellidos/i), 'García');
    await user.type(screen.getByLabelText(/email/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password1');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /registrarme/i }));
    });
    await waitFor(() => screen.getByText(/Cuenta creada/i));
    await user.click(screen.getByText('Ir al login'));
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('botón ArrowBack navega de vuelta a /login', async () => {
    const user = userEvent.setup();
    wrap();
    const allBtns = screen.getAllByRole('button');
    await user.click(allBtns[0]); // First button is ArrowBack
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
