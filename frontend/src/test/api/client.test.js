import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

describe('axios client interceptors', () => {
  beforeEach(() => {
    vi.resetModules(); // force fresh axios instance so interceptors don't bleed between tests
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('request interceptor añade Authorization header cuando hay token', async () => {
    localStorage.setItem('bj_token', 'my-token-abc');
    let capturedAuth = null;
    server.use(
      http.get('/api/viajes', ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json([]);
      })
    );
    const client = (await import('../../api/client')).default;
    await client.get('/viajes');
    expect(capturedAuth).toBe('Bearer my-token-abc');
  });

  it('request interceptor no añade Authorization cuando no hay token', async () => {
    let capturedAuth = 'NOT_SET';
    server.use(
      http.get('/api/viajes', ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json([]);
      })
    );
    const client = (await import('../../api/client')).default;
    await client.get('/viajes');
    expect(capturedAuth).toBeNull();
  });

  it('response interceptor: en 401 intenta refresh y reintenta la petición', async () => {
    localStorage.setItem('bj_token', 'old-token');
    localStorage.setItem('bj_refresh', 'my-refresh');

    let callCount = 0;
    server.use(
      http.get('/api/viajes', () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json({ mensaje: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json([{ id: 1 }]);
      }),
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ token: 'new-token-after-refresh' })
      )
    );

    const client = (await import('../../api/client')).default;
    const res = await client.get('/viajes');
    expect(callCount).toBe(2);
    expect(localStorage.getItem('bj_token')).toBe('new-token-after-refresh');
    expect(res.data).toEqual([{ id: 1 }]);
  });

  it('response interceptor: en 401 sin refresh token rechaza la promesa', async () => {
    localStorage.setItem('bj_token', 'old-token');
    // No refresh token in localStorage

    server.use(
      http.get('/api/viajes', () =>
        HttpResponse.json({ mensaje: 'Unauthorized' }, { status: 401 })
      )
    );

    const client = (await import('../../api/client')).default;
    await expect(client.get('/viajes')).rejects.toThrow();
  });

  it('response interceptor: refresh falla → redirige a /login', async () => {
    localStorage.setItem('bj_token', 'old-token');
    localStorage.setItem('bj_refresh', 'bad-refresh');

    // Capture the href assignment without triggering jsdom navigation
    let redirectedTo = null;
    Object.defineProperty(window, 'location', {
      value: {
        get href() { return 'http://localhost/'; },
        set href(v) { redirectedTo = v; },
      },
      writable: true,
      configurable: true,
    });

    server.use(
      http.get('/api/viajes', () =>
        HttpResponse.json({ mensaje: 'Unauthorized' }, { status: 401 })
      ),
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ error: 'invalid' }, { status: 401 })
      )
    );

    const client = (await import('../../api/client')).default;
    try {
      await client.get('/viajes');
    } catch {
      // expected to throw after failed refresh
    }
    expect(redirectedTo).toBe('/login');
  });

  it('response interceptor: no reintenta si _retry ya está activo (previene bucle infinito)', async () => {
    localStorage.setItem('bj_token', 'old-token');
    localStorage.setItem('bj_refresh', 'my-refresh');

    let refreshCalls = 0;
    server.use(
      http.get('/api/viajes', () =>
        HttpResponse.json({ mensaje: 'Unauthorized' }, { status: 401 })
      ),
      http.post('/api/auth/refresh', () => {
        refreshCalls += 1;
        return HttpResponse.json({ token: 'new-token' });
      })
    );

    const client = (await import('../../api/client')).default;
    try {
      await client.get('/viajes');
    } catch {
      // may fail on second 401 retry
    }
    // Refresh should only be called once (no infinite loop)
    expect(refreshCalls).toBeLessThanOrEqual(1);
  });
});
