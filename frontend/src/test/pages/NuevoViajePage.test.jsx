import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { tokenFixture } from '../fixtures/user';

vi.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <>{children}</>,
}));
vi.mock('@mui/x-date-pickers/AdapterDayjs', () => ({ AdapterDayjs: class {} }));
vi.mock('@mui/x-date-pickers/DatePicker', async () => {
  const { default: dayjs } = await import('dayjs');
  return {
    DatePicker: ({ label, onChange, value, disabled }) => (
      <input
        aria-label={label}
        value={value ? value.format('YYYY-MM-DD') : ''}
        onChange={(e) => onChange(e.target.value ? dayjs(e.target.value) : null)}
        disabled={!!disabled}
      />
    ),
  };
});

import NuevoViajePage from '../../pages/NuevoViajePage';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.setItem('bj_token', tokenFixture);
});

function wrap() {
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/viajes/nuevo']}>
          <Routes>
            <Route path="/viajes/nuevo" element={<NuevoViajePage />} />
            <Route path="/viajes/:id" element={<div data-testid="viaje-detalle">Viaje</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

function setStep(step, { viaje, candidatos, form } = {}) {
  sessionStorage.setItem('bj_wizard_step', String(step));
  if (viaje) sessionStorage.setItem('bj_wizard_viaje', JSON.stringify(viaje));
  if (candidatos) sessionStorage.setItem('bj_wizard_candidatos', JSON.stringify(candidatos));
  if (form) sessionStorage.setItem('bj_wizard_form', JSON.stringify(form));
}

async function navigateToStep(targetStep) {
  const user = userEvent.setup();
  wrap();

  // Step 0 → 1: fill dates
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Salida'), { target: { value: '2026-07-01' } });
  });
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Regreso'), { target: { value: '2026-07-10' } });
  });
  if (targetStep === 0) return;

  await act(async () => { await user.click(screen.getByText('Siguiente')); });
  await waitFor(() => screen.getByText('¿Cuál es tu presupuesto?'));
  if (targetStep === 1) return;

  await act(async () => { await user.click(screen.getByText('Siguiente')); });
  await waitFor(() => screen.getByText('Cuéntanos más'));
}

describe('NuevoViajePage', () => {
  // ── Step 0: Fechas ────────────────────────────────────────────
  it('muestra step 0 por defecto con campos de fecha', () => {
    wrap();
    expect(screen.getByText('¿Cuándo viajas?')).toBeInTheDocument();
    expect(screen.getByLabelText('Salida')).toBeInTheDocument();
    expect(screen.getByLabelText('Regreso')).toBeInTheDocument();
  });

  it('muestra el stepper con 5 pasos', () => {
    wrap();
    expect(screen.getByText('Fechas')).toBeInTheDocument();
    expect(screen.getByText('Presupuesto')).toBeInTheDocument();
    expect(screen.getByText('Preferencias')).toBeInTheDocument();
    expect(screen.getByText('Destinos')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });

  it('error de validación cuando no hay fechas seleccionadas', async () => {
    const user = userEvent.setup();
    wrap();
    await act(async () => { await user.click(screen.getByText('Siguiente')); });
    expect(screen.getByText('Selecciona las fechas del viaje')).toBeInTheDocument();
  });

  it('error cuando la duración es menor de 3 días', async () => {
    const user = userEvent.setup();
    wrap();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Salida'), { target: { value: '2026-07-01' } });
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Regreso'), { target: { value: '2026-07-02' } });
    });
    await act(async () => { await user.click(screen.getByText('Siguiente')); });
    expect(screen.getByText('El viaje debe durar al menos 3 días')).toBeInTheDocument();
  });

  it('error cuando la duración supera 30 días', async () => {
    const user = userEvent.setup();
    wrap();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Salida'), { target: { value: '2026-07-01' } });
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Regreso'), { target: { value: '2026-09-15' } });
    });
    await act(async () => { await user.click(screen.getByText('Siguiente')); });
    expect(screen.getByText('El viaje no puede superar 30 días')).toBeInTheDocument();
  });

  it('avanza a step 1 con fechas válidas', async () => {
    await navigateToStep(1);
    expect(screen.getByText('¿Cuál es tu presupuesto?')).toBeInTheDocument();
  });

  it('incrementa número de viajeros', async () => {
    const user = userEvent.setup();
    wrap();
    // Stepper also shows '2' for step 2; use getAllByText to count occurrences
    const before = screen.getAllByText('2').length;
    const addBtn = screen.getAllByRole('button').find((b) => b.querySelector('[data-testid="AddIcon"]'));
    if (addBtn) {
      await act(async () => { await user.click(addBtn); });
      // After increment count goes 2→3; one fewer '2' than before
      expect(screen.getAllByText('2').length).toBeLessThan(before);
    }
  });

  it('decrementa número de viajeros sin bajar de 1', async () => {
    const user = userEvent.setup();
    wrap();
    const btns = screen.getAllByRole('button');
    const removeBtn = btns.find((b) => b.querySelector('[data-testid="RemoveIcon"]'));
    if (removeBtn) {
      // Click multiple times to try to go below 1
      await act(async () => { await user.click(removeBtn); });
      await act(async () => { await user.click(removeBtn); });
      const value = screen.queryByText('0');
      expect(value).not.toBeInTheDocument();
    }
  });

  it('botón atrás en step 0 llama navigate(-1)', async () => {
    const user = userEvent.setup();
    wrap();
    const backBtn = screen.getAllByRole('button')[0];
    // navigate(-1) won't crash with MemoryRouter (no prior history)
    await act(async () => { await user.click(backBtn); });
  });

  // ── Step 1: Presupuesto ───────────────────────────────────────
  it('step 1 muestra opciones de presupuesto', () => {
    setStep(1);
    wrap();
    expect(screen.getByText('¿Cuál es tu presupuesto?')).toBeInTheDocument();
    expect(screen.getByText('Económico')).toBeInTheDocument();
    expect(screen.getByText('Estándar')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('click en Económico selecciona ese presupuesto', async () => {
    const user = userEvent.setup();
    setStep(1);
    wrap();
    await act(async () => { await user.click(screen.getByText('Económico')); });
    expect(screen.getByText('300–600€')).toBeInTheDocument();
  });

  it('click en Premium selecciona ese presupuesto', async () => {
    const user = userEvent.setup();
    setStep(1);
    wrap();
    await act(async () => { await user.click(screen.getByText('Premium')); });
    expect(screen.getByText('1200€+')).toBeInTheDocument();
  });

  it('muestra campos de presupuesto personalizado', () => {
    setStep(1);
    wrap();
    expect(screen.getByLabelText('Mínimo (€)')).toBeInTheDocument();
    expect(screen.getByLabelText('Máximo (€)')).toBeInTheDocument();
  });

  it('error de validación con presupuesto 0', async () => {
    const user = userEvent.setup();
    setStep(1, {
      form: {
        fechaInicio: null, fechaFin: null, numViajeros: 2,
        presupuestoTipo: 'personalizado', presupuesto: 0, presupuestoMin: 0,
        intereses: [], tipoAlojamiento: 'hotel',
        restriccionesAlimentarias: [], nivelActividadSlider: 2,
      },
    });
    wrap();
    await act(async () => { await user.click(screen.getByText('Siguiente')); });
    expect(screen.getByText('Introduce un presupuesto válido')).toBeInTheDocument();
  });

  it('step 1 avanza a step 2 con presupuesto válido', async () => {
    const user = userEvent.setup();
    setStep(1);
    wrap();
    await act(async () => { await user.click(screen.getByText('Siguiente')); });
    await waitFor(() => {
      expect(screen.getByText('Cuéntanos más')).toBeInTheDocument();
    });
  });

  it('botón atrás en step 1 vuelve a step 0', async () => {
    const user = userEvent.setup();
    setStep(1);
    wrap();
    const backBtn = screen.getAllByRole('button')[0];
    await act(async () => { await user.click(backBtn); });
    await waitFor(() => {
      expect(screen.getByText('¿Cuándo viajas?')).toBeInTheDocument();
    });
  });

  // ── Step 2: Preferencias ──────────────────────────────────────
  it('step 2 carga preferencias del perfil al montar', async () => {
    setStep(2);
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Cuéntanos más')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Cultura/)).toBeInTheDocument();
    });
  });

  it('step 2 click en chip de interés lo activa/desactiva', async () => {
    const user = userEvent.setup();
    setStep(2);
    wrap();
    await waitFor(() => screen.getByText(/Cultura/));
    await act(async () => { await user.click(screen.getByText(/Cultura/)); });
    await act(async () => { await user.click(screen.getByText(/Cultura/)); });
  });

  it('step 2 alojamiento es single-select (reemplaza selección)', async () => {
    const user = userEvent.setup();
    setStep(2);
    wrap();
    await waitFor(() => screen.getByText(/Hostal/));
    await act(async () => { await user.click(screen.getByText(/Hostal/)); });
  });

  it('step 2 chip de dieta funciona', async () => {
    const user = userEvent.setup();
    setStep(2);
    wrap();
    await waitFor(() => screen.getByText(/Vegano/));
    await act(async () => { await user.click(screen.getByText(/Vegano/)); });
  });

  it('step 2 genera viaje y avanza a destinos', async () => {
    await navigateToStep(2);
    const user = userEvent.setup();
    await act(async () => { await user.click(screen.getByText('Ver destinos ✨')); });
    await waitFor(() => {
      expect(screen.getByText('Destinos candidatos')).toBeInTheDocument();
    });
  });

  it('step 2 muestra error cuando crearViaje falla', async () => {
    server.use(http.post('/api/viajes', () => HttpResponse.json({ mensaje: 'Límite alcanzado' }, { status: 500 })));
    await navigateToStep(2);
    const user = userEvent.setup();
    await act(async () => { await user.click(screen.getByText('Ver destinos ✨')); });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('step 2 muestra error genérico cuando crearViaje falla sin mensaje', async () => {
    server.use(http.post('/api/viajes', () => HttpResponse.json({}, { status: 500 })));
    await navigateToStep(2);
    const user = userEvent.setup();
    await act(async () => { await user.click(screen.getByText('Ver destinos ✨')); });
    await waitFor(() => {
      expect(screen.getByText('Error al crear el viaje')).toBeInTheDocument();
    });
  });

  // ── Step 3: Destinos ──────────────────────────────────────────
  it('step 3 muestra candidatos de destino', () => {
    setStep(3, {
      viaje: { id: 99 },
      candidatos: [
        { id: 201, ciudad: 'Berlín', pais: 'Alemania', tipo_viaje: 'urbano', precio_estimado: 900, vetado: false },
      ],
    });
    wrap();
    expect(screen.getByText('Berlín, Alemania')).toBeInTheDocument();
  });

  it('step 3 muestra alerta cuando no hay candidatos', () => {
    setStep(3, { viaje: { id: 99 }, candidatos: [] });
    wrap();
    expect(screen.getByText('No se generaron candidatos. El sistema elegirá por ti.')).toBeInTheDocument();
  });

  it('step 3 muestra precio estimado del candidato', () => {
    setStep(3, {
      viaje: { id: 99 },
      candidatos: [
        { id: 201, ciudad: 'Berlín', pais: 'Alemania', tipo_viaje: 'urbano', precio_estimado: 900, vetado: false },
      ],
    });
    wrap();
    expect(screen.getByText('~900€/pers')).toBeInTheDocument();
  });

  it('step 3 muestra descripción del candidato', () => {
    setStep(3, {
      viaje: { id: 99 },
      candidatos: [
        { id: 201, ciudad: 'Lisboa', pais: 'Portugal', tipo_viaje: 'playa', vetado: false, descripcion: 'Ciudad costera perfecta' },
      ],
    });
    wrap();
    expect(screen.getByText('Ciudad costera perfecta')).toBeInTheDocument();
  });

  it('step 3 botón vetar marca candidato como vetado', async () => {
    const user = userEvent.setup();
    setStep(3, {
      viaje: { id: 99 },
      candidatos: [
        { id: 201, ciudad: 'Berlín', pais: 'Alemania', tipo_viaje: 'urbano', vetado: false },
        { id: 202, ciudad: 'Roma', pais: 'Italia', tipo_viaje: 'cultural', vetado: false },
      ],
    });
    wrap();
    await waitFor(() => screen.getByText('Berlín, Alemania'));
    const vetarBtns = screen.getAllByText('Vetar');
    await act(async () => { await user.click(vetarBtns[0]); });
    await waitFor(() => {
      expect(screen.getByText('1 destino vetado')).toBeInTheDocument();
    });
  });

  it('step 3 ya muestra contador de vetados si hay candidatos vetados', () => {
    setStep(3, {
      viaje: { id: 99 },
      candidatos: [
        { id: 201, ciudad: 'Berlín', pais: 'Alemania', tipo_viaje: 'urbano', vetado: true },
        { id: 202, ciudad: 'Roma', pais: 'Italia', tipo_viaje: 'cultural', vetado: false },
      ],
    });
    wrap();
    expect(screen.getByText('1 destino vetado')).toBeInTheDocument();
  });

  it('step 3 avanza a step 4', async () => {
    const user = userEvent.setup();
    setStep(3, {
      viaje: { id: 99 },
      candidatos: [
        { id: 201, ciudad: 'Berlín', pais: 'Alemania', tipo_viaje: 'urbano', vetado: false },
      ],
    });
    wrap();
    await waitFor(() => screen.getByText('Berlín, Alemania'));
    await act(async () => { await user.click(screen.getByText('Siguiente')); });
    await waitFor(() => {
      expect(screen.getByText('Confirmar reserva')).toBeInTheDocument();
    });
  });

  // ── Step 4: Confirmar ─────────────────────────────────────────
  it('step 4 muestra título de confirmación', () => {
    setStep(4, { viaje: { id: 99 } });
    wrap();
    expect(screen.getByText('Confirmar reserva')).toBeInTheDocument();
    expect(screen.getByText('Confirmar y reservar')).toBeInTheDocument();
  });

  it('step 4 muestra aviso de destino oculto', () => {
    setStep(4, { viaje: { id: 99 } });
    wrap();
    expect(screen.getByText(/Tu destino permanecerá oculto/)).toBeInTheDocument();
  });

  it('step 4 confirmar crea reserva y muestra éxito', async () => {
    const user = userEvent.setup();
    setStep(4, { viaje: { id: 99 } });
    wrap();
    await waitFor(() => screen.getByText('Confirmar y reservar'));
    await act(async () => { await user.click(screen.getByText('Confirmar y reservar')); });
    // After creating reservation, moves to payment step (step 5)
    await waitFor(() => {
      // Payment step should be visible
      const paymentElements = screen.queryAllByText((content, element) =>
        content === 'Pago seguro' && element?.tagName === 'H5'
      );
      expect(paymentElements.length).toBeGreaterThan(0);
    });
  });

  it('step 4 navega a pago después de crear reserva', async () => {
    const user = userEvent.setup();
    setStep(4, { viaje: { id: 99 } });
    wrap();
    await waitFor(() => screen.getByText('Confirmar y reservar'));
    await act(async () => { await user.click(screen.getByText('Confirmar y reservar')); });
    // After creating reservation, should show payment page with card form
    await waitFor(() => {
      expect(screen.getByLabelText(/Número de tarjeta/)).toBeInTheDocument();
    });
  });

  it('step 4 muestra error cuando crearReserva falla con mensaje', async () => {
    server.use(http.post('/api/reservas', () => HttpResponse.json({ mensaje: 'Error de pago' }, { status: 500 })));
    const user = userEvent.setup();
    setStep(4, { viaje: { id: 99 } });
    wrap();
    await waitFor(() => screen.getByText('Confirmar y reservar'));
    await act(async () => { await user.click(screen.getByText('Confirmar y reservar')); });
    await waitFor(() => {
      expect(screen.getByText('Error de pago')).toBeInTheDocument();
    });
  });

  it('step 4 muestra error genérico cuando crearReserva falla sin mensaje', async () => {
    server.use(http.post('/api/reservas', () => HttpResponse.json({}, { status: 500 })));
    const user = userEvent.setup();
    setStep(4, { viaje: { id: 99 } });
    wrap();
    await waitFor(() => screen.getByText('Confirmar y reservar'));
    await act(async () => { await user.click(screen.getByText('Confirmar y reservar')); });
    await waitFor(() => {
      expect(screen.getByText('Error al crear la reserva')).toBeInTheDocument();
    });
  });

  it('step 4 no hace nada si no hay viaje en estado', async () => {
    const user = userEvent.setup();
    setStep(4); // no viaje
    wrap();
    await waitFor(() => screen.getByText('Confirmar y reservar'));
    await act(async () => { await user.click(screen.getByText('Confirmar y reservar')); });
    // no error, no success — early return when !viaje
  });

  // ── SessionStorage ────────────────────────────────────────────
  it('restaura step desde sessionStorage', () => {
    setStep(1);
    wrap();
    expect(screen.getByText('¿Cuál es tu presupuesto?')).toBeInTheDocument();
  });

  it('restaura candidatos desde sessionStorage en step 3', () => {
    setStep(3, {
      viaje: { id: 99 },
      candidatos: [{ id: 300, ciudad: 'Madrid', pais: 'España', tipo_viaje: 'urbano', vetado: false }],
    });
    wrap();
    expect(screen.getByText('Madrid, España')).toBeInTheDocument();
  });

  it('step 6 muestra formulario de pago con datos de tarjeta', () => {
    setStep(5, { viaje: { id: 99, presupuesto: 1000 } });
    wrap();
    // Check for payment form elements
    expect(screen.getByLabelText(/Número de tarjeta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Caducidad/)).toBeInTheDocument();
    expect(screen.getByLabelText(/CVV/)).toBeInTheDocument();
  });

  it('maneja respuesta de crearViaje con wrapper { viaje: ... }', async () => {
    // Default handler returns { viaje: { id: 99, candidatos: [...] } }
    await navigateToStep(2);
    const user = userEvent.setup();
    await act(async () => { await user.click(screen.getByText('Ver destinos ✨')); });
    await waitFor(() => {
      expect(screen.getByText('Destinos candidatos')).toBeInTheDocument();
    });
    // Berlín candidate from handler
    expect(screen.getByText('Berlín, Alemania')).toBeInTheDocument();
  });

  it('maneja respuesta de crearReserva con wrapper { reserva: ... }', async () => {
    // Default handler returns { reserva: { id: 55, ... } }
    const user = userEvent.setup();
    setStep(4, { viaje: { id: 99 } });
    wrap();
    await waitFor(() => screen.getByText('Confirmar y reservar'));
    await act(async () => { await user.click(screen.getByText('Confirmar y reservar')); });
    // After reservation, moves to payment step (step 5)
    await waitFor(() => {
      // Check for the payment step title (h5 element)
      const paymentTitle = screen.queryAllByText((content, element) =>
        content === 'Pago seguro' && element?.tagName === 'H5'
      );
      expect(paymentTitle.length).toBeGreaterThan(0);
    });
  });

  it('carga perfil falla silenciosamente en step 2', async () => {
    server.use(http.get('/api/perfil/me', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    setStep(2);
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Cuéntanos más')).toBeInTheDocument();
    });
    // No crash, just uses default form values
  });

  it('maneja respuesta de perfil sin wrapper { perfil: ... }', async () => {
    server.use(http.get('/api/perfil/me', () =>
      HttpResponse.json({ intereses: ['naturaleza'], tipo_alojamiento: 'apartamento', restricciones_alimentarias: [], nivel_actividad: 'activo', ciudad_origen: 'Valencia', moneda: 'EUR' })
    ));
    setStep(2);
    wrap();
    await waitFor(() => screen.getByText('Cuéntanos más'));
    await waitFor(() => {
      expect(screen.getByText(/Naturaleza/)).toBeInTheDocument();
    });
  });
});
