import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import ViajeCard from '../../components/ViajeCard';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function wrap(viaje) {
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/viajes']}>
          <ViajeCard viaje={viaje} />
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

const viajeBase = {
  id: 1,
  estado: 'pendiente',
  destino_revelado: false,
  fecha_inicio: '2026-07-01',
  fecha_fin: '2026-07-08',
  duracion: 7,
};

describe('ViajeCard', () => {
  it('muestra destino oculto cuando no está revelado', () => {
    wrap(viajeBase);
    // Destination code hidden: "???" text must NOT be visible (component renders LockIcon SVG instead)
    expect(screen.queryByText('???')).not.toBeInTheDocument();
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('muestra código de destino revelado', () => {
    wrap({ ...viajeBase, destino_revelado: true, destino_ciudad: 'París', destino_pais: 'Francia', estado: 'revelado' });
    // "París".toUpperCase().substring(0,3) = "PAR"
    expect(screen.getByText('PAR')).toBeInTheDocument();
  });

  it('muestra el ID formateado del viaje', () => {
    wrap(viajeBase);
    expect(screen.getByText(/BJ#0001/)).toBeInTheDocument();
  });

  it('navega a /viajes/:id al hacer click', async () => {
    const user = userEvent.setup();
    wrap(viajeBase);
    await user.click(screen.getByText(/BJ#0001/));
    expect(screen.getByTestId('location').textContent).toBe('/viajes/1');
  });

  it('muestra fecha de inicio y fin', () => {
    wrap(viajeBase);
    // Dates are shown
    expect(screen.getByText('Salida')).toBeInTheDocument();
    expect(screen.getByText('Regreso')).toBeInTheDocument();
    expect(screen.getByText('Duración')).toBeInTheDocument();
    expect(screen.getByText('7 días')).toBeInTheDocument();
  });

  it('muestra chip de estado confirmado', () => {
    wrap({ ...viajeBase, estado: 'confirmado' });
    expect(screen.getByText('confirmado')).toBeInTheDocument();
  });

  it('muestra chip de estado cancelado', () => {
    wrap({ ...viajeBase, estado: 'cancelado' });
    expect(screen.getByText('cancelado')).toBeInTheDocument();
  });

  it('muestra chip de estado completado', () => {
    wrap({ ...viajeBase, estado: 'completado' });
    expect(screen.getByText('completado')).toBeInTheDocument();
  });

  it('muestra chip de estado revelado', () => {
    wrap({ ...viajeBase, estado: 'revelado', destino_revelado: true, destino_ciudad: 'Roma', destino_pais: 'Italia' });
    expect(screen.getByText('revelado')).toBeInTheDocument();
  });

  it('funciona sin fechas', () => {
    const { container } = wrap({ id: 2, estado: 'pendiente', destino_revelado: false });
    expect(container).toBeDefined();
  });

  it('usa estado por defecto para estado desconocido', () => {
    wrap({ ...viajeBase, estado: 'desconocido' });
    expect(screen.getByText('desconocido')).toBeInTheDocument();
  });
});
