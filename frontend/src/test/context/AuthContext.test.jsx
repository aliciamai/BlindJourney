import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { userFixture, tokenFixture, refreshTokenFixture } from '../fixtures/user';

function TestConsumer() {
  const { user, token, login, logout, refreshAuth, updateUser } = useAuth();
  return (
    <div>
      <span data-testid="token">{token || 'no-token'}</span>
      <span data-testid="user">{user ? user.nombre : 'no-user'}</span>
      <button onClick={async () => { try { await login('ana@test.com', 'Password1'); } catch {} }}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => refreshAuth()}>Refresh</button>
      <button onClick={() => updateUser({ ...userFixture, nombre: 'Updated' })}>Update</button>
    </div>
  );
}

function wrap(initialLS = {}) {
  Object.entries(initialLS).forEach(([k, v]) => localStorage.setItem(k, v));
  return render(<AuthProvider><TestConsumer /></AuthProvider>);
}

describe('AuthContext', () => {
  it('estado inicial vacío cuando no hay localStorage', () => {
    wrap();
    expect(screen.getByTestId('token').textContent).toBe('no-token');
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  it('estado inicial desde localStorage', () => {
    wrap({
      bj_token: tokenFixture,
      bj_user: JSON.stringify(userFixture),
    });
    expect(screen.getByTestId('token').textContent).toBe(tokenFixture);
    expect(screen.getByTestId('user').textContent).toBe('Ana');
  });

  it('estado inicial maneja bj_user JSON inválido', () => {
    wrap({ bj_token: tokenFixture, bj_user: 'not-json' });
    expect(screen.getByTestId('token').textContent).toBe(tokenFixture);
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  it('login() llama API y guarda tokens en localStorage', async () => {
    const user = userEvent.setup();
    wrap();
    await act(async () => {
      await user.click(screen.getByText('Login'));
    });
    expect(screen.getByTestId('token').textContent).toBe(tokenFixture);
    expect(screen.getByTestId('user').textContent).toBe('Ana');
    expect(localStorage.getItem('bj_token')).toBe(tokenFixture);
    expect(localStorage.getItem('bj_refresh')).toBe(refreshTokenFixture);
  });

  it('login() no actualiza el estado cuando la API falla', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ mensaje: 'error' }, { status: 401 })));
    const user = userEvent.setup();
    wrap();
    await act(async () => {
      await user.click(screen.getByText('Login'));
    });
    expect(screen.getByTestId('token').textContent).toBe('no-token');
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  it('logout() limpia localStorage y el estado', async () => {
    const user = userEvent.setup();
    wrap({
      bj_token: tokenFixture,
      bj_refresh: refreshTokenFixture,
      bj_user: JSON.stringify(userFixture),
    });
    await act(async () => {
      await user.click(screen.getByText('Logout'));
    });
    expect(screen.getByTestId('token').textContent).toBe('no-token');
    expect(screen.getByTestId('user').textContent).toBe('no-user');
    expect(localStorage.getItem('bj_token')).toBeNull();
  });

  it('logout() funciona aunque no haya refresh token', async () => {
    const user = userEvent.setup();
    wrap({ bj_token: tokenFixture });
    await act(async () => {
      await user.click(screen.getByText('Logout'));
    });
    expect(screen.getByTestId('token').textContent).toBe('no-token');
  });

  it('logout() continúa aunque la API de logout falle', async () => {
    server.use(http.post('/api/auth/logout', () => HttpResponse.json({ error: 'error' }, { status: 500 })));
    const user = userEvent.setup();
    wrap({ bj_token: tokenFixture, bj_refresh: refreshTokenFixture });
    await act(async () => {
      await user.click(screen.getByText('Logout'));
    });
    expect(screen.getByTestId('token').textContent).toBe('no-token');
  });

  it('refreshAuth() actualiza el token', async () => {
    localStorage.setItem('bj_refresh', refreshTokenFixture);
    const user = userEvent.setup();
    wrap({ bj_token: tokenFixture, bj_refresh: refreshTokenFixture });
    await act(async () => {
      await user.click(screen.getByText('Refresh'));
    });
    expect(localStorage.getItem('bj_token')).toBe('new-access-token');
  });

  it('refreshAuth() devuelve null cuando no hay refresh token', async () => {
    const user = userEvent.setup();
    wrap({ bj_token: tokenFixture });
    await act(async () => {
      await user.click(screen.getByText('Refresh'));
    });
    // No refresh token, should return null without crashing
    expect(screen.getByTestId('token').textContent).toBe(tokenFixture);
  });

  it('refreshAuth() llama logout cuando el refresh falla', async () => {
    server.use(http.post('/api/auth/refresh', () => HttpResponse.json({ error: 'invalid' }, { status: 401 })));
    const user = userEvent.setup();
    wrap({ bj_token: tokenFixture, bj_refresh: 'bad-refresh' });
    await act(async () => {
      await user.click(screen.getByText('Refresh'));
    });
    // After failed refresh, logout is called which clears state
    expect(screen.getByTestId('token').textContent).toBe('no-token');
  });

  it('updateUser() actualiza el estado y localStorage', async () => {
    const user = userEvent.setup();
    wrap({ bj_token: tokenFixture, bj_user: JSON.stringify(userFixture) });
    await act(async () => {
      await user.click(screen.getByText('Update'));
    });
    expect(screen.getByTestId('user').textContent).toBe('Updated');
    const stored = JSON.parse(localStorage.getItem('bj_user'));
    expect(stored.nombre).toBe('Updated');
  });
});
