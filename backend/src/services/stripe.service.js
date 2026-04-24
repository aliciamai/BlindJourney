// ============================================================
// BlindJourney – Servicio de Pagos con Stripe
// ============================================================

const Stripe = require('stripe');

// La instancia se crea de forma lazy para que los tests no
// fallen si STRIPE_SECRET_KEY no está definida
let _stripe = null;
const getStripe = () => {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY no configurada en .env');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  }
  return _stripe;
};

/**
 * Crea un PaymentIntent en Stripe.
 * @param {number} importeCentimos - Importe en céntimos (ej: 5000 = 50,00€)
 * @param {string} moneda - Código ISO (eur, usd...)
 * @param {object} metadata - Datos extra para el webhook (viaje_id, usuario_id)
 */
const crearPaymentIntent = async (importeCentimos, moneda = 'eur', metadata = {}) =>
  getStripe().paymentIntents.create({
    amount:   importeCentimos,
    currency: moneda,
    metadata,
    automatic_payment_methods: { enabled: true },
  });

/**
 * Cancela un PaymentIntent pendiente.
 */
const cancelarPaymentIntent = async (paymentIntentId) =>
  getStripe().paymentIntents.cancel(paymentIntentId);

/**
 * Emite un reembolso sobre un PaymentIntent ya cobrado.
 * Si no se indica importe, se reembolsa el total.
 */
const reembolsar = async (paymentIntentId, importeCentimos = null) => {
  const params = { payment_intent: paymentIntentId };
  if (importeCentimos) params.amount = importeCentimos;
  return getStripe().refunds.create(params);
};

/**
 * Verifica la firma del webhook de Stripe para evitar peticiones falsas.
 * Necesita el body RAW (Buffer), no el JSON parseado.
 */
const verificarWebhook = (rawBody, signature) =>
  getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

module.exports = { crearPaymentIntent, cancelarPaymentIntent, reembolsar, verificarWebhook };
