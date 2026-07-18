import prisma from '../../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../../lib/api'
import { getPayment, validateWebhookSignature } from '../../../../../lib/mercado-pago'

// POST /api/super-admin/webhooks/mercado-pago
export async function POST(req) {
  try {
    const body = await req.json()
    console.log('Mercado Pago webhook received:', body)

    // Validate webhook signature
    if (!validateWebhookSignature(req, body)) {
      return errorResponse('Invalid signature', 401)
    }

    const { type, data } = body
    if (type === 'payment' && data?.id) {
      const paymentId = data.id
      const paymentData = await getPayment(paymentId)

      // Find payment in our system by externalId or update it
      let payment = await prisma.payment.findFirst({
        where: { externalId: paymentId.toString() }
      })

      if (payment) {
        // Update payment status
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: { status: paymentData.status }
        })

        // If payment approved, update subscription
        if (paymentData.status === 'approved') {
          await prisma.subscription.update({
            where: { id: payment.subscriptionId },
            data: {
              status: 'active',
              lastPaymentDate: new Date(),
              nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days later
            }
          })
        }
      }
    }

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('Mercado Pago webhook error:', error)
    return jsonResponse({ success: true }) // Always return 200 to Mercado Pago
  }
}
