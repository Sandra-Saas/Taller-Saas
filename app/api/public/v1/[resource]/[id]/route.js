import prisma from '../../../../../../lib/prisma'
import { createAuditLog } from '../../../../../../lib/audit'
import { errorResponse, jsonResponse } from '../../../../../../lib/api'
import { getPlanRateLimit, hasScope, PUBLIC_API_RESOURCES, WEBHOOK_EVENTS } from '../../../../../../lib/public-api'
import { checkRateLimit } from '../../../../../../lib/rate-limit'
import { getRequestContext } from '../../../../../../lib/request-context'
import { emitWebhookEvent } from '../../../../../../lib/webhooks'

export const dynamic = 'force-dynamic'

function rateHeaders(result) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  }
}

async function authorize(req, scope) {
  const context = await getRequestContext(req)
  if (!context?.tenantId) {
    return { error: errorResponse('API no autenticada.', 401) }
  }

  if (!hasScope(context.scopes || ['*'], scope)) {
    return { error: errorResponse('La credencial actual no tiene alcance suficiente.', 403) }
  }

  const limits = getPlanRateLimit(context.tenant?.plan?.name || context.tokenPayload?.plan)
  const result = checkRateLimit({
    key: `${context.tenantId}:${context.apiKey?.id || context.userId || context.ipAddress || 'public'}:${scope}`,
    windowMs: limits.windowMs,
    max: limits.max,
  })

  if (!result.allowed) {
    return { error: errorResponse('Rate limit excedido para el plan actual.', 429, rateHeaders(result)) }
  }

  return { context, headers: rateHeaders(result) }
}

async function updateResource(resource, id, payload, context) {
  if (resource === 'turns') {
    const previous = await prisma.calendarEvent.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        status: payload.status || previous.status,
        startDate: payload.startDate ? new Date(payload.startDate) : previous.startDate,
        endDate: payload.endDate ? new Date(payload.endDate) : previous.endDate,
        title: payload.title || previous.title,
      },
    })

    return { previous, updated }
  }

  if (resource === 'work-orders') {
    const previous = await prisma.workOrder.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: payload.status || previous.status,
        priority: payload.priority || previous.priority,
        notes: payload.notes ?? previous.notes,
      },
    })

    if (payload.status === 'completed') {
      await emitWebhookEvent({
        tenantId: context.tenantId,
        event: WEBHOOK_EVENTS.workOrderFinished,
        payload: updated,
      })
    }

    return { previous, updated }
  }

  if (resource === 'quotations') {
    const previous = await prisma.quotation.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        status: payload.status || previous.status,
        notes: payload.notes ?? previous.notes,
      },
    })

    if (payload.status === 'approved') {
      await emitWebhookEvent({
        tenantId: context.tenantId,
        event: WEBHOOK_EVENTS.quotationApproved,
        payload: updated,
      })
    }

    return { previous, updated }
  }

  if (resource === 'invoices') {
    const previous = await prisma.invoice.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const nextNotes = payload.paymentReference
      ? [previous.notes, `Pago registrado: ${payload.paymentReference}`].filter(Boolean).join(' | ')
      : previous.notes

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: payload.status || 'paid',
        notes: nextNotes,
      },
    })

    await emitWebhookEvent({
      tenantId: context.tenantId,
      event: WEBHOOK_EVENTS.paymentReceived,
      payload: {
        invoiceId: updated.id,
        status: updated.status,
        paymentReference: payload.paymentReference || null,
      },
    })

    return { previous, updated }
  }

  return { unsupported: true }
}

export async function GET(req, { params }) {
  try {
    const { resource, id } = params
    const config = PUBLIC_API_RESOURCES[resource]
    if (!config) {
      return errorResponse('Recurso no soportado por la API pública.', 404)
    }

    const auth = await authorize(req, config.readScope)
    if (auth.error) {
      return auth.error
    }

    const record = await prisma[config.model].findFirst({
      where: {
        id,
        tenantId: auth.context.tenantId,
      },
      include: config.include,
    })

    if (!record) {
      return errorResponse('Registro no encontrado.', 404)
    }

    return jsonResponse(record, 200, auth.headers)
  } catch (error) {
    console.error('Error obteniendo detalle público:', error)
    return errorResponse('No se pudo obtener el detalle solicitado.')
  }
}

export async function PATCH(req, { params }) {
  try {
    const { resource, id } = params
    const config = PUBLIC_API_RESOURCES[resource]
    if (!config) {
      return errorResponse('Recurso no soportado por la API pública.', 404)
    }

    const auth = await authorize(req, config.writeScope)
    if (auth.error) {
      return auth.error
    }

    const payload = await req.json()
    const result = await updateResource(resource, id, payload, auth.context)

    if (result.notFound) {
      return errorResponse('Registro no encontrado.', 404)
    }

    if (result.unsupported) {
      return errorResponse('Este recurso no admite actualizaciones en esta versión.', 400)
    }

    await createAuditLog({
      tenantId: auth.context.tenantId,
      userId: auth.context.actingUserId,
      action: `${resource}.updated`,
      entity: resource,
      entityId: id,
      oldData: result.previous,
      newData: result.updated,
      ipAddress: auth.context.ipAddress,
      userAgent: auth.context.userAgent,
    })

    return jsonResponse(result.updated, 200, auth.headers)
  } catch (error) {
    console.error('Error actualizando detalle público:', error)
    return errorResponse(error.message || 'No se pudo actualizar el registro solicitado.')
  }
}
