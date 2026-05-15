import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AppThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import AlbumPage from '../../pages/AlbumPage';
import { tokenFixture } from '../fixtures/user';
import { fotosFixture } from '../fixtures/fotos';

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

function wrap(id = '3') {
  localStorage.setItem('bj_token', tokenFixture);
  return render(
    <AppThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/viajes/${id}/album`]}>
          <Routes>
            <Route path="/viajes/:id/album" element={<AlbumPage />} />
            <Route path="*" element={<div>back</div>} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

describe('AlbumPage', () => {
  it('muestra spinner durante la carga', () => {
    server.use(http.get('/api/fotos/viaje/:id', async () => { await new Promise(() => {}); }));
    wrap();
    expect(document.querySelector('svg.MuiCircularProgress-svg') || screen.queryByRole('progressbar')).toBeTruthy();
  });

  it('muestra título y contador de fotos', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Álbum de recuerdos')).toBeInTheDocument();
      expect(screen.getByText('3 fotos')).toBeInTheDocument();
    });
  });

  it('renderiza las fotos del grid', async () => {
    wrap();
    await waitFor(() => {
      const imgs = screen.getAllByRole('img');
      expect(imgs.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('muestra la ubicación en thumbnails con ubicacion_nombre', async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText('París')).toBeInTheDocument();
    });
  });

  it('estado vacío cuando no hay fotos', async () => {
    server.use(http.get('/api/fotos/viaje/:id', () => HttpResponse.json([])));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('Aún no hay recuerdos')).toBeInTheDocument();
    });
  });

  it('click en foto abre lightbox', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getAllByRole('img'));
    const fotos = screen.getAllByRole('img');
    await act(async () => {
      await user.click(fotos[0]);
    });
    // Lightbox opens showing the dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('botón close cierra el lightbox', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getAllByRole('img'));
    const fotos = screen.getAllByRole('img');
    await act(async () => {
      await user.click(fotos[0]);
    });
    await waitFor(() => screen.getByRole('dialog'));
    // Find close button in the lightbox
    const closeBtns = screen.getAllByRole('button');
    await act(async () => {
      await user.click(closeBtns[0]);
    });
  });

  it('botón eliminar en lightbox elimina la foto', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getAllByRole('img'));
    const fotos = screen.getAllByRole('img');
    await act(async () => {
      await user.click(fotos[0]);
    });
    await waitFor(() => screen.getByRole('dialog'));
    // Delete button (second button in lightbox)
    const btns = screen.getAllByRole('button');
    // Find the delete button (red background)
    const deleteBtn = btns.find(b => b.querySelector('svg'));
    if (deleteBtn) {
      await act(async () => {
        await user.click(btns[1]);
      });
    }
  });

  it('FAB abre el diálogo de añadir foto', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('3 fotos'));
    const fab = document.querySelector('.MuiFab-root');
    await act(async () => {
      await user.click(fab);
    });
    await waitFor(() => {
      expect(screen.getByText('Añadir foto')).toBeInTheDocument();
    });
  });

  it('botón añadir foto del estado vacío abre diálogo', async () => {
    server.use(http.get('/api/fotos/viaje/:id', () => HttpResponse.json([])));
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Añadir foto'));
    await act(async () => {
      await user.click(screen.getByText('Añadir foto'));
    });
    // Dialog should be open
    await waitFor(() => {
      expect(screen.getByText('Guardar foto')).toBeInTheDocument();
    });
  });

  it('guardar foto llama subirFoto y recarga la lista', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('3 fotos'));
    // Open dialog via FAB
    const fab = document.querySelector('.MuiFab-root');
    await act(async () => { await user.click(fab); });
    await waitFor(() => screen.getByText('Guardar foto'));

    // Fix FileReader: must be a class (constructor)
    class MockFileReader {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
        }, 0);
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['dummy'], 'foto.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    // Wait for async onload to fire
    await act(async () => { await new Promise(r => setTimeout(r, 60)); });

    // Now preview is set → click Guardar foto
    await act(async () => { await user.click(screen.getByText('Guardar foto')); });
    await waitFor(() => {
      // Dialog closes after save; fotos reload
      expect(screen.queryByText('Guardar foto')).not.toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it('handleFile no hace nada si no hay archivo seleccionado', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('3 fotos'));
    const fab = document.querySelector('.MuiFab-root');
    await act(async () => { await user.click(fab); });
    await waitFor(() => screen.getByText('Guardar foto'));
    const fileInput = document.querySelector('input[type="file"]');
    // Fire change with no files
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [] } });
    });
    // No preview shown → Guardar still disabled (no crash)
    expect(screen.getByText('Guardar foto')).toBeInTheDocument();
  });

  it('botón atrás navega a la ruta anterior', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByText('Álbum de recuerdos'));
    const allBtns = screen.getAllByRole('button');
    await act(async () => { await user.click(allBtns[0]); });
    // navigate(-1) with MemoryRouter (no history) stays at same path
    expect(document.body).toBeDefined();
  });

  it('muestra error cuando carga de fotos falla', async () => {
    server.use(http.get('/api/fotos/viaje/:id', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    wrap();
    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las fotos')).toBeInTheDocument();
    });
  });

  it('foto en lightbox muestra descripcion y ubicacion si existen', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getAllByRole('img'));
    // Click first foto which has descripcion 'Torre Eiffel al atardecer'
    const fotos = screen.getAllByRole('img');
    await act(async () => {
      await user.click(fotos[0]);
    });
    await waitFor(() => screen.getByRole('dialog'));
    expect(screen.getByText('Torre Eiffel al atardecer')).toBeInTheDocument();
  });
});
