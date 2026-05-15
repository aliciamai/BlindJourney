// ============================================================
// BlindJourney – Stub de localStorage para Tests
// Autora: Alicia Maillo
//
// Reemplaza localStorage y sessionStorage con implementations basadas en Map.
// Necesario porque los tests corren en Node.js (sin navegador real).
//
// IMPORTANTE: Este archivo NO tiene imports. Debe ejecutarse PRIMERO,
// antes de que cualquier módulo importado llame a localStorage en su inicio.
// Vitest configura esto en vitest.config.js con setupFiles.
//
// Sin este stub:
// - localStorage.getItem() causaría "ReferenceError: localStorage is not defined"
// - AuthContext fallaría al intentar leer el token en el init
// - Los tests se romperían
//
// Con este stub:
// - localStorage funciona como una Map en memoria
// - Cada test limpia su estado (setup.js llama localStorage.clear())
// ============================================================

// ── IMPLEMENTACIÓN DE STORAGE ────────────────────────────
// Map en memoria: simula el comportamiento de localStorage/sessionStorage
const _storage = new Map();
const _localStorageStub = {
  getItem: (key) => _storage.has(key) ? _storage.get(key) : null,
  setItem: (key, value) => { _storage.set(String(key), String(value)); },
  removeItem: (key) => { _storage.delete(String(key)); },
  clear: () => { _storage.clear(); },
  get length() { return _storage.size; },
  key: (index) => ([..._storage.keys()][index] ?? null),
};

if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: _localStorageStub,
    writable: true,
    configurable: true,
  });
}

if (typeof globalThis.sessionStorage === 'undefined' || typeof globalThis.sessionStorage.setItem !== 'function') {
  const _ss = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: {
      getItem: (key) => _ss.has(key) ? _ss.get(key) : null,
      setItem: (key, value) => { _ss.set(String(key), String(value)); },
      removeItem: (key) => { _ss.delete(String(key)); },
      clear: () => { _ss.clear(); },
      get length() { return _ss.size; },
      key: (index) => ([..._ss.keys()][index] ?? null),
    },
    writable: true,
    configurable: true,
  });
}
