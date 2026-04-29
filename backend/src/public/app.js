'use strict';

// ── Estado global ─────────────────────────────────────────────────────────────
let token = localStorage.getItem('bj_token') || '';
let refreshTokenStored = localStorage.getItem('bj_refresh') || '';

const BASE = window.location.origin;

// ── Helpers de lectura de campos ─────────────────────────────────────────────
function val(id) {
  return (document.getElementById(id)?.value ?? '').trim();
}
function num(id) {
  const v = val(id);
  return v ? Number(v) : undefined;
}
function parseTextarea(id) {
  const raw = val(id);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { _error: 'JSON inválido en el textarea' }; }
}

// ── Token bar ─────────────────────────────────────────────────────────────────
function updateTokenBar() {
  const el = document.getElementById('token-display');
  if (!el) return;
  if (token) {
    el.textContent = token;
    el.classList.remove('empty');
  } else {
    el.textContent = 'sin token — haz login primero';
    el.classList.add('empty');
  }
}

function copyToken() {
  if (!token) { alert('No hay token guardado'); return; }
  navigator.clipboard.writeText(token).then(() => alert('Token copiado al portapapeles'));
}

function clearToken() {
  token = '';
  refreshTokenStored = '';
  localStorage.removeItem('bj_token');
  localStorage.removeItem('bj_refresh');
  updateTokenBar();
  const el1 = document.getElementById('logout-refresh');
  const el2 = document.getElementById('refresh-tok');
  if (el1) el1.value = '';
  if (el2) el2.value = '';
}

// ── Navegación ────────────────────────────────────────────────────────────────
function show(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('nav button[data-nav]').forEach(b => b.classList.remove('active'));
  const target = document.getElementById('section-' + id);
  if (target) target.classList.add('active');
  btn.classList.add('active');
}

function toggleCard(header) {
  const body = header.nextElementSibling;
  if (body) body.classList.toggle('open');
}

// ── Render respuesta ──────────────────────────────────────────────────────────
function statusClass(code) {
  if (!code) return 's0xx';
  if (code >= 500) return 's5xx';
  if (code >= 400) return 's4xx';
  if (code >= 300) return 's3xx';
  return 's2xx';
}

function colorizeJSON(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    match => {
      if (match.startsWith('"')) {
        if (match.endsWith(':')) return `<span class="json-key">${match}</span>`;
        return `<span class="json-str">${match}</span>`;
      }
      if (match === 'true' || match === 'false') return `<span class="json-bool">${match}</span>`;
      if (match === 'null') return `<span class="json-null">${match}</span>`;
      return `<span class="json-num">${match}</span>`;
    }
  );
}

function renderResponse(container, status, data, elapsed, method, url) {
  const cls = statusClass(status);
  let body;
  try {
    body = typeof data === 'string' ? data : colorizeJSON(data);
  } catch {
    body = String(data);
  }
  container.innerHTML = `
    <div class="response-header">
      <span class="status-badge ${cls}">${status || 'ERR'}</span>
      <span class="response-time">${elapsed}ms</span>
      <span class="response-route">${method} ${url}</span>
    </div>
    <pre class="json">${body}</pre>`;
  addLog(method, url, status, data, elapsed);
}

function addLog(method, url, status, data, elapsed) {
  const time = new Date().toLocaleTimeString('es-ES');
  const container = document.getElementById('log-entries');
  if (!container) return;
  const placeholder = container.querySelector('.empty-log');
  if (placeholder) placeholder.remove();

  let body;
  try { body = typeof data === 'string' ? data : colorizeJSON(data); } catch { body = String(data); }

  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <div class="log-entry-header">
      <span class="log-time">${time}</span>
      <span class="method ${method}">${method}</span>
      <span class="log-url">${url}</span>
      <span class="status-badge ${statusClass(status)}">${status || 'ERR'}</span>
      <span class="response-time">${elapsed}ms</span>
    </div>
    <pre class="json">${body}</pre>`;
  container.prepend(entry);
  if (container.children.length > 50) container.lastElementChild?.remove();
}

// ── Fetch genérico ────────────────────────────────────────────────────────────
async function send(btn, method, url, body, auth) {
  const card = btn.closest('.card-body');
  const responseEl = card?.querySelector('.response');
  if (!responseEl) return;

  btn.disabled = true;
  btn.textContent = '…';
  responseEl.innerHTML = '';

  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== null && body !== undefined && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }

  const t0 = Date.now();
  try {
    const res = await fetch(BASE + url, opts);
    const elapsed = Date.now() - t0;
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    renderResponse(responseEl, res.status, data, elapsed, method, url);
  } catch (err) {
    renderResponse(responseEl, 0, { error: err.message }, Date.now() - t0, method, url);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar';
  }
}

// ── Login especial (guarda token) ─────────────────────────────────────────────
async function sendLogin(btn) {
  const card = btn.closest('.card-body');
  const responseEl = card?.querySelector('.response');
  if (!responseEl) return;

  btn.disabled = true;
  btn.textContent = '…';
  responseEl.innerHTML = '';

  const body = { email: val('login-email'), password: val('login-password') };
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const elapsed = Date.now() - t0;
    const data = await res.json();

    if (res.ok && data.token) {
      token = data.token;
      refreshTokenStored = data.refreshToken || '';
      localStorage.setItem('bj_token', token);
      if (refreshTokenStored) {
        localStorage.setItem('bj_refresh', refreshTokenStored);
        const el1 = document.getElementById('logout-refresh');
        const el2 = document.getElementById('refresh-tok');
        if (el1) el1.value = refreshTokenStored;
        if (el2) el2.value = refreshTokenStored;
      }
      updateTokenBar();
    }
    renderResponse(responseEl, res.status, data, elapsed, 'POST', '/api/auth/login');
  } catch (err) {
    renderResponse(responseEl, 0, { error: err.message }, Date.now() - t0, 'POST', '/api/auth/login');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar';
  }
}

// ── Refresh especial (actualiza token) ────────────────────────────────────────
async function sendRefresh(btn) {
  const card = btn.closest('.card-body');
  const responseEl = card?.querySelector('.response');
  if (!responseEl) return;

  btn.disabled = true;
  btn.textContent = '…';
  responseEl.innerHTML = '';

  const rt = val('refresh-tok') || refreshTokenStored;
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + '/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    const elapsed = Date.now() - t0;
    const data = await res.json();
    if (res.ok && data.token) {
      token = data.token;
      localStorage.setItem('bj_token', token);
      updateTokenBar();
    }
    renderResponse(responseEl, res.status, data, elapsed, 'POST', '/api/auth/refresh');
  } catch (err) {
    renderResponse(responseEl, 0, { error: err.message }, Date.now() - t0, 'POST', '/api/auth/refresh');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar';
  }
}

// ── sendRaw (Authorization header custom, para tests de error) ───────────────
async function sendRaw(btn, method, url, body, authHeader) {
  const card = btn.closest('.card-body');
  const responseEl = card?.querySelector('.response');
  if (!responseEl) return;

  btn.disabled = true;
  btn.textContent = '…';
  responseEl.innerHTML = '';

  const headers = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  const opts = { method, headers };
  if (body !== null && body !== undefined && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }

  const t0 = Date.now();
  try {
    const res = await fetch(BASE + url, opts);
    const elapsed = Date.now() - t0;
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    renderResponse(responseEl, res.status, data, elapsed, method, url);
  } catch (err) {
    renderResponse(responseEl, 0, { error: err.message }, Date.now() - t0, method, url);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar';
  }
}

// ── Mapa de acciones ─────────────────────────────────────────────────────────
const actions = {
  // Health
  health: btn => send(btn, 'GET', '/health'),

  // Auth
  registro: btn => send(btn, 'POST', '/api/auth/registro', {
    nombre:    val('reg-nombre'),
    apellidos: val('reg-apellidos'),
    email:     val('reg-email'),
    password:  val('reg-password'),
    ...(val('reg-telefono') ? { telefono: val('reg-telefono') } : {}),
  }),

  login: btn => sendLogin(btn),

  logout: btn => send(btn, 'POST', '/api/auth/logout', {
    ...(val('logout-refresh') ? { refreshToken: val('logout-refresh') } : {}),
  }),

  'verificar-email': btn => send(btn, 'GET', `/api/auth/verificar/${val('verif-token')}`),

  'recuperar-password': btn => send(btn, 'POST', '/api/auth/recuperar-password', {
    email: val('recup-email'),
  }),

  'nueva-password': btn => send(btn, 'POST', '/api/auth/nueva-password', {
    token:         val('nueva-token'),
    nuevaPassword: val('nueva-pass'),
  }),

  refresh: btn => sendRefresh(btn),

  // Viajes
  'viajes-list': btn => send(btn, 'GET', '/api/viajes', null, true),

  'viajes-get': btn => send(btn, 'GET', `/api/viajes/${val('viaje-id-get')}`, null, true),

  'viajes-create': btn => {
    const extra = parseTextarea('viaje-extra');
    const body = {
      destino: val('viaje-destino'),
      ...extra,
    };
    const presupuesto = num('viaje-presupuesto');
    if (presupuesto) body.presupuesto = presupuesto;
    const fecha = val('viaje-fecha');
    if (fecha) body.fechaInicio = fecha;
    const duracion = num('viaje-duracion');
    if (duracion) body.duracion = duracion;
    send(btn, 'POST', '/api/viajes', body, true);
  },

  'viajes-revelar': btn => send(btn, 'PATCH', `/api/viajes/${val('viaje-id-revelar')}/revelar`, {}, true),

  // Reservas
  'reservas-list': btn => send(btn, 'GET', '/api/reservas', null, true),

  'reservas-create': btn => {
    const body = parseTextarea('reserva-body');
    send(btn, 'POST', '/api/reservas', body, true);
  },

  'reservas-cancelar': btn => send(btn, 'PATCH', `/api/reservas/${val('reserva-id')}/cancelar`, {}, true),

  // Itinerarios
  'itin-get': btn => send(btn, 'GET', `/api/itinerarios/viaje/${val('itin-viaje-id')}`, null, true),

  'itin-regen': btn => send(btn, 'POST', `/api/itinerarios/viaje/${val('itin-viaje-id-regen')}/regenerar`, {}, true),

  // Perfil
  'perfil-get': btn => send(btn, 'GET', '/api/perfil/me', null, true),

  'perfil-update': btn => {
    const extra = parseTextarea('perfil-extra');
    const body = { ...extra };
    if (val('perfil-nombre'))    body.nombre    = val('perfil-nombre');
    if (val('perfil-apellidos')) body.apellidos  = val('perfil-apellidos');
    if (val('perfil-telefono'))  body.telefono   = val('perfil-telefono');
    if (val('perfil-idioma'))    body.idioma     = val('perfil-idioma');
    send(btn, 'PUT', '/api/perfil/me', body, true);
  },

  // Notificaciones
  'notif-list': btn => {
    const pagina       = val('notif-pagina') || '1';
    const limite       = val('notif-limite') || '20';
    const soloNoLeidas = document.getElementById('notif-solo-no-leidas')?.checked ? 'true' : 'false';
    send(btn, 'GET', `/api/notificaciones?pagina=${pagina}&limite=${limite}&solo_no_leidas=${soloNoLeidas}`, null, true);
  },

  'notif-leer-todas': btn => send(btn, 'PATCH', '/api/notificaciones/leer-todas', {}, true),

  'notif-leer': btn => send(btn, 'PATCH', `/api/notificaciones/${val('notif-id-leer')}/leer`, {}, true),

  'notif-delete': btn => send(btn, 'DELETE', `/api/notificaciones/${val('notif-id-delete')}`, null, true),

  // ── Errores — JWT / Autorización ─────────────────────────────────────────
  'err-no-token':       btn => send(btn, 'GET', '/api/viajes', null, false),
  'err-token-invalido': btn => sendRaw(btn, 'GET', '/api/viajes', null, 'Bearer token.invalido.firma_falsa'),
  'err-token-expirado': btn => sendRaw(btn, 'GET', '/api/viajes', null, `Bearer ${val('err-token-exp')}`),

  // ── Errores — Auth 400 Validaciones ──────────────────────────────────────
  'err-reg-vacio':          btn => send(btn, 'POST', '/api/auth/registro', {}),
  'err-reg-email-invalido': btn => send(btn, 'POST', '/api/auth/registro', {
    nombre: 'Test', apellidos: 'User', email: 'no-es-un-email', password: 'Password123!',
  }),
  'err-reg-pass-corta': btn => send(btn, 'POST', '/api/auth/registro', {
    nombre: 'Test', apellidos: 'User', email: 'test.corta@example.com', password: 'abc',
  }),
  'err-login-email-invalido': btn => send(btn, 'POST', '/api/auth/login', {
    email: 'no-es-email', password: 'Password123!',
  }),
  'err-login-sin-password': btn => send(btn, 'POST', '/api/auth/login', {
    email: 'test@example.com',
  }),
  'err-verif-token-invalido': btn => send(btn, 'GET',
    '/api/auth/verificar/00000000000000000000000000000000aaaabbbbccccdddd0000111122223333'),
  'err-nueva-pass-invalido': btn => send(btn, 'POST', '/api/auth/nueva-password', {
    token: 'tokenFalsoQueNoExisteEnLaBaseDeDatos12345', nuevaPassword: 'NuevaPass456!',
  }),

  // ── Errores — Auth 401 / 403 Credenciales ────────────────────────────────
  'err-login-credenciales': btn => send(btn, 'POST', '/api/auth/login', {
    email: 'usuario_inexistente_99999@example.com', password: 'ContrasenaIncorrecta999!',
  }),
  'err-login-no-verificado': btn => send(btn, 'POST', '/api/auth/login', {
    email: val('err-email-no-verif'), password: val('err-pass-no-verif'),
  }),

  // ── Errores — Refresh 401 ────────────────────────────────────────────────
  'err-refresh-sin-token': btn => send(btn, 'POST', '/api/auth/refresh', {}),
  'err-refresh-invalido':  btn => send(btn, 'POST', '/api/auth/refresh', {
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.invalidsignature',
  }),
  'err-refresh-revocado': btn => send(btn, 'POST', '/api/auth/refresh', {
    refreshToken: val('err-refresh-revocado-tok'),
  }),

  // ── Errores — 409 Conflictos ─────────────────────────────────────────────
  'err-reg-email-existe': btn => send(btn, 'POST', '/api/auth/registro', {
    nombre: val('err-nombre-existe'), apellidos: 'Apellido',
    email: val('err-email-existe'), password: 'Password123!',
  }),
  'err-viaje-ya-revelado':    btn => send(btn, 'PATCH', `/api/viajes/${val('err-viaje-revelado-id')}/revelar`, {}, true),
  'err-reserva-ya-cancelada': btn => send(btn, 'PATCH', `/api/reservas/${val('err-reserva-cancelada-id')}/cancelar`, {}, true),
  'err-itin-regen-no-revelado': btn => send(btn, 'POST', `/api/itinerarios/viaje/${val('err-viaje-no-revelado-id')}/regenerar`, {}, true),

  // ── Errores — 404 No encontrado ──────────────────────────────────────────
  'err-viaje-404':           btn => send(btn, 'GET',    '/api/viajes/99999', null, true),
  'err-reservas-viaje-404':  btn => send(btn, 'POST',   '/api/reservas', { viajeId: 99999, hotel: 'Hotel Test', noches: 3 }, true),
  'err-reservas-cancelar-404': btn => send(btn, 'PATCH', '/api/reservas/99999/cancelar', {}, true),
  'err-itin-404':            btn => send(btn, 'GET',    `/api/itinerarios/viaje/${val('err-viaje-sin-itin')}`, null, true),
  'err-notif-leer-404':      btn => send(btn, 'PATCH',  '/api/notificaciones/99999/leer', {}, true),
  'err-notif-delete-404':    btn => send(btn, 'DELETE', '/api/notificaciones/99999', null, true),
  'err-doc-viaje-404':       btn => send(btn, 'GET',    '/api/documentos/viaje/99999', null, true),
  'err-doc-404':             btn => send(btn, 'PUT',    '/api/documentos/99999', { nombre: 'Test' }, true),
  'err-doc-delete-404':      btn => send(btn, 'DELETE', '/api/documentos/99999', null, true),
  'err-perfil-404':          btn => sendRaw(btn, 'GET', '/api/perfil/me', null, `Bearer ${val('err-perfil-jwt-eliminado')}`),
};

// ── Inicialización (cuando el DOM está listo) ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Navegación lateral
  document.querySelectorAll('button[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => show(btn.dataset.nav, btn));
  });

  // Toggle de cards
  document.querySelectorAll('.card-header').forEach(header => {
    header.addEventListener('click', () => toggleCard(header));
  });

  // Botones de envío
  document.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const handler = actions[action];
      if (handler) {
        handler(btn);
      } else {
        console.error('[BlindJourney] Acción desconocida:', action);
      }
    });
  });

  // Barra de token
  document.getElementById('btn-copy-token')?.addEventListener('click', copyToken);
  document.getElementById('btn-clear-token')?.addEventListener('click', clearToken);

  // Estado inicial
  updateTokenBar();

  // Abrir la card de Health automáticamente
  document.querySelector('#section-health .card-header')?.click();
});
