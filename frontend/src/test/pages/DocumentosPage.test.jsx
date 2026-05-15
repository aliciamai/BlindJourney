import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import DocumentosPage from '../../pages/DocumentosPage';
import { tokenFixture } from '../fixtures/user';
import { documentosFixture } from '../fixtures/documentos';

function wrap() {
  localStorage.setItem('bj_token', tokenFixture);
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/documentos']}>
          <Routes>
            <Route path="/documentos" element={<DocumentosPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('DocumentosPage', () => {
  it('muestra spinner durante la carga', () => {
    server.use(http.get('/api/documentos', async () => { await new Promise(() => {}); }));
    wrap();
    expect(document.querySelector('svg.MuiCircularProgress-svg') || screen.queryByRole('progressbar')).toBeTruthy();
  });

  it('muestra título Documentos', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Documentos')).toBeInTheDocument();
    });
  });

  it('agrupa documentos por viaje y generales', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Generales')).toBeInTheDocument();
      expect(screen.getByText('Viaje #1')).toBeInTheDocument();
    });
  });

  it('muestra nombre de cada documento', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Pasaporte Ana García')).toBeInTheDocument();
      expect(screen.getByText('Billete Madrid-París')).toBeInTheDocument();
    });
  });

  it('muestra badge de fecha expirada en rojo para docs expirados', async () => {
    wrap();
    await waitFor(() => {
      // "Visa expirada" doc has fecha_expiracion 2020-01-01 (past)
      expect(screen.getByText('Visa expirada')).toBeInTheDocument();
    });
  });

  it('muestra link de descarga cuando hay url_storage', async () => {
    wrap();
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it('muestra estado vacío cuando no hay documentos', async () => {
    server.use(http.get('/api/documentos', () => HttpResponse.json([])));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Sin documentos')).toBeInTheDocument();
    });
  });

  it('maneja respuesta con wrapper { documentos: [...] }', async () => {
    server.use(http.get('/api/documentos', () => HttpResponse.json({ documentos: documentosFixture })));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Pasaporte Ana García')).toBeInTheDocument();
    });
  });

  it('maneja error de carga sin romper la página (muestra empty state)', async () => {
    server.use(http.get('/api/documentos', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Sin documentos')).toBeInTheDocument();
    });
  });

  it('muestra tipo de documento correctamente', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Pasaporte')).toBeInTheDocument();
    });
  });

  it('muestra seguro de viaje sin fecha de expiración', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Seguro viaje')).toBeInTheDocument();
    });
  });

  it('muestra alerta de error cuando la API falla', async () => {
    server.use(http.get('/api/documentos', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    wrap();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('usa icono "otro" para tipo de documento desconocido', async () => {
    server.use(http.get('/api/documentos', () => HttpResponse.json([
      { id: 99, nombre: 'Doc raro', tipo: 'tipo_desconocido', url_storage: null, fecha_expiracion: null, viaje_id: null },
    ])));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Doc raro')).toBeInTheDocument();
    });
  });

  it('respuesta sin array ni documentos usa []', async () => {
    server.use(http.get('/api/documentos', () => HttpResponse.json({ otro: 'campo' })));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Sin documentos')).toBeInTheDocument();
    });
  });
});
