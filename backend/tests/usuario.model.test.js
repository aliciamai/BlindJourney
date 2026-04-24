describe('UsuarioModel', () => {
  let UsuarioModel;

  beforeEach(() => {
    jest.resetModules();
    UsuarioModel = require('../src/models/usuario.model');
  });

  it('buscarPorEmail devuelve null si no hay usuarios', async () => {
    expect(await UsuarioModel.buscarPorEmail('x@x.com')).toBeNull();
  });

  it('buscarPorId devuelve null si no hay usuarios', async () => {
    expect(await UsuarioModel.buscarPorId(1)).toBeNull();
  });

  it('crear añade un usuario con id y email_verificado false', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'hash' });
    expect(user.id).toBe(1);
    expect(user.email_verificado).toBe(false);
    expect(user.password_hash).toBe('hash');
  });

  it('buscarPorEmail encuentra el usuario creado', async () => {
    await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'hash' });
    const found = await UsuarioModel.buscarPorEmail('ali@t.com');
    expect(found).not.toBeNull();
    expect(found.nombre).toBe('Ali');
  });

  it('buscarPorId encuentra el usuario creado', async () => {
    const created = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'hash' });
    const found = await UsuarioModel.buscarPorId(created.id);
    expect(found).not.toBeNull();
  });

  it('guardarRefreshToken actualiza el token del usuario', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'hash' });
    await UsuarioModel.guardarRefreshToken(user.id, 'refresh-tok');
    const found = await UsuarioModel.buscarPorId(user.id);
    expect(found.refresh_token).toBe('refresh-tok');
  });

  it('guardarRefreshToken no falla si el usuario no existe', async () => {
    await expect(UsuarioModel.guardarRefreshToken(999, 'tok')).resolves.toBeUndefined();
  });

  it('eliminarRefreshToken borra el token del usuario', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'hash' });
    await UsuarioModel.guardarRefreshToken(user.id, 'tok-para-borrar');
    await UsuarioModel.eliminarRefreshToken('tok-para-borrar');
    const found = await UsuarioModel.buscarPorId(user.id);
    expect(found.refresh_token).toBeNull();
  });

  it('eliminarRefreshToken no falla si el token no existe', async () => {
    await expect(UsuarioModel.eliminarRefreshToken('inexistente')).resolves.toBeUndefined();
  });

  it('buscarPorTokenVerificacion encuentra el usuario con ese token', async () => {
    await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'h', tokenVerificacion: 'tok-verif' });
    const found = await UsuarioModel.buscarPorTokenVerificacion('tok-verif');
    expect(found).not.toBeNull();
  });

  it('buscarPorTokenVerificacion devuelve null si el token no existe', async () => {
    expect(await UsuarioModel.buscarPorTokenVerificacion('no-existe')).toBeNull();
  });

  it('verificarEmail marca email_verificado y borra el token', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'h', tokenVerificacion: 'tok' });
    await UsuarioModel.verificarEmail(user.id);
    const found = await UsuarioModel.buscarPorId(user.id);
    expect(found.email_verificado).toBe(true);
    expect(found.tokenVerificacion).toBeNull();
  });

  it('verificarEmail no falla si el usuario no existe', async () => {
    await expect(UsuarioModel.verificarEmail(999)).resolves.toBeUndefined();
  });

  it('guardarTokenReset guarda token y expiración', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'h' });
    const exp = new Date(Date.now() + 3600 * 1000);
    await UsuarioModel.guardarTokenReset(user.id, 'reset-tok', exp);
    const found = await UsuarioModel.buscarPorId(user.id);
    expect(found.reset_token).toBe('reset-tok');
  });

  it('guardarTokenReset no falla si el usuario no existe', async () => {
    await expect(UsuarioModel.guardarTokenReset(999, 'tok', new Date())).resolves.toBeUndefined();
  });

  it('buscarPorTokenReset encuentra el usuario con token vigente', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'h' });
    const exp = new Date(Date.now() + 3600 * 1000);
    await UsuarioModel.guardarTokenReset(user.id, 'valid-reset', exp);
    const found = await UsuarioModel.buscarPorTokenReset('valid-reset');
    expect(found).not.toBeNull();
  });

  it('buscarPorTokenReset devuelve null si el token expiró', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'h' });
    const exp = new Date(Date.now() - 1000);
    await UsuarioModel.guardarTokenReset(user.id, 'expired-reset', exp);
    const found = await UsuarioModel.buscarPorTokenReset('expired-reset');
    expect(found).toBeNull();
  });

  it('buscarPorTokenReset devuelve null si el token no existe', async () => {
    expect(await UsuarioModel.buscarPorTokenReset('no-existe')).toBeNull();
  });

  it('actualizarPassword cambia el hash y borra el token de reset', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'old' });
    await UsuarioModel.actualizarPassword(user.id, 'new-hash');
    const found = await UsuarioModel.buscarPorId(user.id);
    expect(found.password_hash).toBe('new-hash');
    expect(found.reset_token).toBeNull();
  });

  it('actualizarPassword no falla si el usuario no existe', async () => {
    await expect(UsuarioModel.actualizarPassword(999, 'hash')).resolves.toBeUndefined();
  });

  it('verificarRefreshToken devuelve true si coincide', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'h' });
    await UsuarioModel.guardarRefreshToken(user.id, 'my-refresh');
    const result = await UsuarioModel.verificarRefreshToken(user.id, 'my-refresh');
    expect(result).toBe(true);
  });

  it('verificarRefreshToken devuelve false si no coincide', async () => {
    const user = await UsuarioModel.crear({ nombre: 'Ali', email: 'ali@t.com', passwordHash: 'h' });
    await UsuarioModel.guardarRefreshToken(user.id, 'my-refresh');
    const result = await UsuarioModel.verificarRefreshToken(user.id, 'otro-token');
    expect(result).toBe(false);
  });

  it('verificarRefreshToken devuelve false si el usuario no existe', async () => {
    const result = await UsuarioModel.verificarRefreshToken(999, 'tok');
    expect(result).toBe(false);
  });
});
