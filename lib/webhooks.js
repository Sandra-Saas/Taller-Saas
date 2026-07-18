import crypto from 'crypto'
import prisma from './prisma'

function shouldSendWebhook(events, eventName) {
  if (!Array.isArray(events)) {
    return false
  }

  return events.includes('*') || events.includes(eventName)
}

function buildSignature(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export async function emitWebhookEvent({ tenantId, event, payload }) {
  if (!tenantId || !event) {
    return []
  }

  const webhooks = await prisma.webhook.findMany({
    where: {
      tenantId,
      isActive: true,
    },
  })

  const matchingWebhooks = webhooks.filter((webhook) => shouldSendWebhook(webhook.events, event))
  const results = []

  for (const webhook of matchingWebhooks) {
    const serializedPayload = JSON.stringify({
      event,
      sentAt: new Date().toISOString(),
      payload,
    })

    const log = await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        tenantId,
        event,
        payload: JSON.parse(serializedPayload),
        status: 'pending',
        attempts: 0,
      },
    })

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TallerSaas-Event': event,
          'X-TallerSaas-Webhook': webhook.id,
          'X-TallerSaas-Signature': buildSignature(webhook.secret, serializedPayload),
        },
        body: serializedPayload,
      })

      const responseText = await response.text()

      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          status: response.ok ? 'success' : 'failed',
          statusCode: response.status,
          response: responseText.slice(0, 4000),
          attempts: 1,
          nextRetryAt: response.ok ? null : new Date(Date.now() + 5 * 60 * 1000),
        },
      })

      results.push({ webhookId: webhook.id, delivered: response.ok, status: response.status })
    } catch (error) {
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          response: error.message,
          attempts: 1,
          nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      })

      results.push({ webhookId: webhook.id, delivered: false, status: 0, error: error.message })
    }
  }

  return results
}
