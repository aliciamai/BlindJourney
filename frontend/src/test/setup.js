// ============================================================
// BlindJourney – Setup de Tests (Vitest)
// Autora: Alicia Maillo
//
// Configuración global para TODOS los tests.
// Carga ANTES de cualquier test se ejecute.
//
// Responsabilidades:
// 1. Inicializar MSW (Mock Service Worker) para mockear HTTP requests
// 2. Cargar i18n para que las traducciones estén disponibles
// 3. Inicializar polyfills para APIs del navegador (matchMedia, scrollTo, etc.)
// 4. Limpiar estado después de cada test (localStorage, sessionStorage, handlers)
//
// Patrón: beforeAll/afterEach/afterAll del test runner (Vitest)
// ============================================================

// Jest-DOM: extiende las matchers de Vitest (útil para testing-library)
import '@testing-library/jest-dom';
// MSW server: intercepta requests HTTP durante los tests
import { server } from './mocks/server';
// i18n: carga las traducciones (necesario para componentes que usan t())
import '../i18n/index.js';

// ── CICLO DE VIDA DE MSW ──────────────────────────────────
/**
 * beforeAll: inicia el servidor MSW antes de cualquier test
 * - onUnhandledRequest: 'warn' → avisa si hay requests sin mock (útil para debugging)
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

/**
 * afterEach: limpia estado después de cada test
 * - resetHandlers(): restaura los handlers originales (útil si algún test los cambió)
 * - localStorage/sessionStorage.clear(): limpia datos guardados en pruebas anteriores
 */
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
});

/**
 * afterAll: cierra el servidor MSW después de todos los tests
 */
afterAll(() => server.close());

// ── window polyfills required by MUI ─────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'scrollTo', { writable: true, value: vi.fn() });

global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.ResizeObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ── Google Maps stub ─────────────────────────────────────────
global.window.google = {
  maps: {
    SymbolPath: { CIRCLE: 0 },
    Geocoder: class {
      geocode(_req, callback) {
        callback(
          [{ geometry: { location: { lat: () => 48.8566, lng: () => 2.3522 } } }],
          'OK'
        );
      }
    },
  },
};
