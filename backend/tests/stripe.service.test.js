jest.mock('stripe', () => {
  const inst = {
    paymentIntents: { create: jest.fn(), cancel: jest.fn() },
    refunds:        { create: jest.fn() },
    webhooks:       { constructEvent: jest.fn() },
  };
  const M = jest.fn(() => inst);
  M.__inst = inst;
  return M;
});

describe('stripe.service', () => {
  let svc, inst;

  beforeEach(() => {
    jest.resetModules();
    process.env.STRIPE_SECRET_KEY     = 'sk_test_x';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_x';
    svc  = require('../src/services/stripe.service');
    inst = require('stripe').__inst;
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('lanza error si STRIPE_SECRET_KEY no está configurada', async () => {
    jest.resetModules();
    delete process.env.STRIPE_SECRET_KEY;
    const s = require('../src/services/stripe.service');
    await expect(s.crearPaymentIntent(100)).rejects.toThrow('STRIPE_SECRET_KEY no configurada en .env');
  });

  it('crearPaymentIntent llama a paymentIntents.create con los parámetros correctos', async () => {
    inst.paymentIntents.create.mockResolvedValue({ id: 'pi_1' });
    const r = await svc.crearPaymentIntent(5000, 'eur', { viaje_id: 1 });
    expect(inst.paymentIntents.create).toHaveBeenCalledWith({
      amount: 5000, currency: 'eur', metadata: { viaje_id: 1 },
      automatic_payment_methods: { enabled: true },
    });
    expect(r.id).toBe('pi_1');
  });

  it('crearPaymentIntent usa "eur" y {} por defecto', async () => {
    inst.paymentIntents.create.mockResolvedValue({ id: 'pi_2' });
    await svc.crearPaymentIntent(1000);
    expect(inst.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'eur', metadata: {} })
    );
  });

  it('reutiliza la instancia de Stripe (singleton)', async () => {
    inst.paymentIntents.create.mockResolvedValue({});
    await svc.crearPaymentIntent(100);
    await svc.crearPaymentIntent(200);
    expect(require('stripe')).toHaveBeenCalledTimes(1);
  });

  it('cancelarPaymentIntent llama a paymentIntents.cancel', async () => {
    inst.paymentIntents.cancel.mockResolvedValue({ status: 'canceled' });
    const r = await svc.cancelarPaymentIntent('pi_x');
    expect(inst.paymentIntents.cancel).toHaveBeenCalledWith('pi_x');
    expect(r.status).toBe('canceled');
  });

  it('reembolsar sin importe no incluye amount', async () => {
    inst.refunds.create.mockResolvedValue({ id: 're_1' });
    await svc.reembolsar('pi_y');
    expect(inst.refunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_y' });
  });

  it('reembolsar con importe incluye amount', async () => {
    inst.refunds.create.mockResolvedValue({ id: 're_2' });
    await svc.reembolsar('pi_z', 500);
    expect(inst.refunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_z', amount: 500 });
  });

  it('verificarWebhook llama a webhooks.constructEvent', () => {
    const raw = Buffer.from('{}');
    inst.webhooks.constructEvent.mockReturnValue({ type: 'charge.succeeded' });
    const ev = svc.verificarWebhook(raw, 'sig_x');
    expect(inst.webhooks.constructEvent).toHaveBeenCalledWith(raw, 'sig_x', 'whsec_x');
    expect(ev.type).toBe('charge.succeeded');
  });
});
