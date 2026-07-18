import { createHmac, timingSafeEqual } from 'crypto'

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

function parseSignatureHeader(value = '') {
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [key, rawValue] = part.split('=')
      if (key && rawValue) {
        acc[key.trim().toLowerCase()] = rawValue.trim()
      }
      return acc
    }, {})
}

function getMercadoPagoDataId(req, body = null) {
  const url = new URL(req.url)
  return (
    url.searchParams.get('data.id') ||
    url.searchParams.get('id') ||
    body?.data?.id?.toString() ||
    body?.id?.toString() ||
    ''
  )
}

function normalizeTimestamp(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null
  }

  return numericValue > 1e12 ? numericValue : numericValue * 1000
}

export function validateWebhookSignature(req, body = null) {
  const secret = String(process.env.MERCADOPAGO_WEBHOOK_SECRET || '').trim()
  if (!secret) {
    return false
  }

  const signatureParts = parseSignatureHeader(req.headers.get('x-signature') || '')
  const ts = signatureParts.ts
  const v1 = signatureParts.v1
  const requestId = String(req.headers.get('x-request-id') || '').trim()
  const dataId = getMercadoPagoDataId(req, body)

  if (!ts || !v1 || !requestId || !dataId) {
    return false
  }

  const timestamp = normalizeTimestamp(ts)
  if (!timestamp) {
    return false
  }

  const maxAgeMs = 5 * 60 * 1000
  if (Math.abs(Date.now() - timestamp) > maxAgeMs) {
    return false
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expectedSignature = createHmac('sha256', secret).update(manifest).digest('hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')
  const receivedBuffer = Buffer.from(v1, 'hex')

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer)
}
