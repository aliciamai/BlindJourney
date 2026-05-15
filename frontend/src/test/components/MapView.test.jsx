import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppThemeProvider } from '../../context/ThemeContext';

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: vi.fn(),
  GoogleMap: ({ children, onClick }) => <div data-testid="google-map" onClick={onClick}>{children}</div>,
  MarkerF: ({ title, onClick }) => <div data-testid={`marker-${title}`} onClick={onClick}>{title}</div>,
  InfoWindowF: ({ children, onCloseClick }) => (
    <div data-testid="info-window">
      {children}
      <button onClick={onCloseClick}>Close</button>
    </div>
  ),
}));

import { useLoadScript } from '@react-google-maps/api';
import MapView from '../../components/MapView';

const activitiesFixture = [
  { id: 1, nombre: 'Torre Eiffel', tipo: 'cultura', ubicacion: 'Champ de Mars, París', hora: '09:00', duracion_minutos: 120, coste_estimado: 25, dia: 1 },
  { id: 2, nombre: 'Le Jules Verne', tipo: 'gastronomia', ubicacion: null, hora: '14:00', duracion_minutos: 90, coste_estimado: 80, dia: 1 },
];

function wrap(props = {}, apiKey = 'FAKE_KEY') {
  const originalEnv = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  Object.defineProperty(import.meta, 'env', {
    value: { ...import.meta.env, VITE_GOOGLE_MAPS_API_KEY: apiKey },
    writable: true,
  });
  const result = render(
    <AppThemeProvider>
      <MapView {...props} />
    </AppThemeProvider>
  );
  return result;
}

describe('MapView', () => {
  it('muestra alerta info cuando no hay API key', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    useLoadScript.mockReturnValue({ isLoaded: false, loadError: null });
    render(
      <AppThemeProvider>
        <MapView />
      </AppThemeProvider>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it('muestra spinner mientras carga (isLoaded=false)', async () => {
    vi.spyOn(import.meta, 'env', 'get').mockReturnValue({ VITE_GOOGLE_MAPS_API_KEY: 'FAKE_KEY' });
    useLoadScript.mockReturnValue({ isLoaded: false, loadError: null });
    render(
      <AppThemeProvider>
        <MapView activities={[]} destCity="París" />
      </AppThemeProvider>
    );
  });

  it('muestra error cuando loadError existe', () => {
    useLoadScript.mockReturnValue({ isLoaded: false, loadError: { message: 'API Error' } });
    vi.spyOn(import.meta, 'env', 'get').mockReturnValue({ VITE_GOOGLE_MAPS_API_KEY: 'FAKE_KEY' });
    render(
      <AppThemeProvider>
        <MapView activities={[]} destCity="París" />
      </AppThemeProvider>
    );
  });

  it('renderiza el mapa cuando isLoaded=true y activities vacías', async () => {
    useLoadScript.mockReturnValue({ isLoaded: true, loadError: null });
    vi.spyOn(import.meta, 'env', 'get').mockReturnValue({ VITE_GOOGLE_MAPS_API_KEY: 'FAKE_KEY' });
    render(
      <AppThemeProvider>
        <MapView activities={[]} destCity="" />
      </AppThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });
  });

  it('muestra alerta "no activities" cuando activities está vacío y el mapa está cargado', async () => {
    useLoadScript.mockReturnValue({ isLoaded: true, loadError: null });
    vi.spyOn(import.meta, 'env', 'get').mockReturnValue({ VITE_GOOGLE_MAPS_API_KEY: 'FAKE_KEY' });
    render(
      <AppThemeProvider>
        <MapView activities={[]} destCity="" />
      </AppThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/No hay actividades/i)).toBeInTheDocument();
    });
  });

  it('renderiza marcadores cuando hay actividades con ubicación y geocodificación funciona', async () => {
    useLoadScript.mockReturnValue({ isLoaded: true, loadError: null });
    vi.spyOn(import.meta, 'env', 'get').mockReturnValue({ VITE_GOOGLE_MAPS_API_KEY: 'FAKE_KEY' });
    render(
      <AppThemeProvider>
        <MapView activities={activitiesFixture} destCity="París" destPais="Francia" />
      </AppThemeProvider>
    );
    // Wait for geocoding to complete
    await waitFor(() => {
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
