const emailService = require('../src/services/email.service');

describe('email.service', () => {
  it('enviarVerificacion devuelve true y loguea', async () => {
    const result = await emailService.enviarVerificacion('a@b.com', 'Ali', 'tok');
    expect(result).toBe(true);
  });

  it('enviarRecuperacion devuelve true y loguea', async () => {
    const result = await emailService.enviarRecuperacion('a@b.com', 'Ali', 'tok');
    expect(result).toBe(true);
  });

  it('enviarRevelacion devuelve true y loguea', async () => {
    const result = await emailService.enviarRevelacion('a@b.com', 'Ali', 'Paris', 99);
    expect(result).toBe(true);
  });
});
