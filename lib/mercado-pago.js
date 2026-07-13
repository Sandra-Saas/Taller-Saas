// Mercado Pago integration helper
// Note: Install mercadopago SDK: npm install mercadopago

export async function createPayment(amount, description, externalReference, notificationUrl) {
  // TODO: Replace with real Mercado Pago SDK integration
  // Example (requires mercadopago package):
  // import mercadopago from 'mercadopago'
  // mercadopago.configure({ access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN })

  // For now, return mock payment
  return {
    id: 'mock-payment-id',
    status: 'pending',
    status_detail: 'pending_waiting_payment',
    init_point: 'https://www.mercadopago.com.ar',
  }
}

export async function getPayment(paymentId) {
  // TODO: Real implementation
  return {
    id: paymentId,
    status: 'approved',
    transaction_amount: 100,
  }
}

export function validateWebhookSignature(req) {
  // TODO: Implement real signature validation
  return true
}
