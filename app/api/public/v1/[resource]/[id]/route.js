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
  if (resource === 'clients') {
    const previous = await prisma.client.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        firstName: payload.firstName || previous.firstName,
        lastName: payload.lastName || previous.lastName,
        status: payload.status || previous.status,
        birthday: Object.prototype.hasOwnProperty.call(payload, 'birthday')
          ? payload.birthday
            ? new Date(payload.birthday)
            : null
          : previous.birthday,
        notes: payload.notes ?? previous.notes,
      },
      include: {
        phones: true,
        emails: true,
        addresses: true,
        company: true,
        vehicles: true,
        workOrders: true,
      },
    })

    return { previous, updated }
  }

  if (resource === 'vehicles') {
    const previous = await prisma.vehicle.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        brand: payload.brand || previous.brand,
        model: payload.model || previous.model,
        year: Object.prototype.hasOwnProperty.call(payload, 'year') ? Number(payload.year || 0) || null : previous.year,
        plate: payload.plate ?? previous.plate,
        vin: payload.vin ?? previous.vin,
        engine: payload.engine ?? previous.engine,
        chassis: payload.chassis ?? previous.chassis,
        color: payload.color ?? previous.color,
        mileage: Object.prototype.hasOwnProperty.call(payload, 'mileage')
          ? Number(payload.mileage || 0) || null
          : previous.mileage,
        fuel: payload.fuel ?? previous.fuel,
        notes: payload.notes ?? previous.notes,
        clientId: payload.clientId || previous.clientId,
      },
      include: {
        client: true,
        branch: true,
      },
    })

    return { previous, updated }
  }

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

  if (resource === 'receptions') {
    const previous = await prisma.reception.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const updated = await prisma.reception.update({
      where: { id },
      data: {
        date: payload.date ? new Date(payload.date) : previous.date,
        mileage: Object.prototype.hasOwnProperty.call(payload, 'mileage')
          ? Number(payload.mileage || 0) || null
          : previous.mileage,
        fuelLevel: payload.fuelLevel || previous.fuelLevel,
        visibleDamages: payload.visibleDamages ?? previous.visibleDamages,
        notes: payload.notes ?? previous.notes,
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
        validUntil: Object.prototype.hasOwnProperty.call(payload, 'validUntil')
          ? payload.validUntil
            ? new Date(payload.validUntil)
            : null
          : previous.validUntil,
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

  if (resource === 'inventory') {
    const previous = await prisma.inventoryItem.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: payload.name || previous.name,
        type: payload.type || previous.type,
        description: payload.description ?? previous.description,
        sku: payload.sku ?? previous.sku,
        stock: Object.prototype.hasOwnProperty.call(payload, 'stock') ? Number(payload.stock || 0) : previous.stock,
        minStock: Object.prototype.hasOwnProperty.call(payload, 'minStock')
          ? Number(payload.minStock || 0)
          : previous.minStock,
        purchasePrice: Object.prototype.hasOwnProperty.call(payload, 'purchasePrice')
          ? Number(payload.purchasePrice || 0)
          : previous.purchasePrice,
        salePrice: Object.prototype.hasOwnProperty.call(payload, 'salePrice')
          ? Number(payload.salePrice || 0)
          : previous.salePrice,
        location: payload.location ?? previous.location,
        notes: payload.notes ?? previous.notes,
      },
    })

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
      ? [payload.notes ?? previous.notes, `Pago registrado: ${payload.paymentReference}`].filter(Boolean).join(' | ')
      : (payload.notes ?? previous.notes)

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

  if (resource === 'pos') {
    const previous = await prisma.posTransaction.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const updated = await prisma.posTransaction.update({
      where: { id },
      data: {
        paymentMethod: payload.paymentMethod || previous.paymentMethod,
        type: payload.type || previous.type,
        notes: payload.notes ?? previous.notes,
        subtotal: Object.prototype.hasOwnProperty.call(payload, 'subtotal')
          ? Number(payload.subtotal || 0)
          : previous.subtotal,
        discount: Object.prototype.hasOwnProperty.call(payload, 'discount')
          ? Number(payload.discount || 0)
          : previous.discount,
        tax: Object.prototype.hasOwnProperty.call(payload, 'tax')
          ? Number(payload.tax || 0)
          : previous.tax,
        total: Object.prototype.hasOwnProperty.call(payload, 'total')
          ? Number(payload.total || 0)
          : previous.total,
      },
    })

    return { previous, updated }
  }

  if (resource === 'warranties') {
    const previous = await prisma.warranty.findFirst({
      where: { id, tenantId: context.tenantId },
    })
    if (!previous) {
      return { notFound: true }
    }

    const updated = await prisma.warranty.update({
      where: { id },
      data: {
        status: payload.status || previous.status,
        description: payload.description ?? previous.description,
        claimNotes: payload.claimNotes ?? previous.claimNotes,
        claimDate: payload.status === 'claimed' ? new Date() : previous.claimDate,
        startDate: payload.startDate ? new Date(payload.startDate) : previous.startDate,
        endDate: payload.endDate ? new Date(payload.endDate) : previous.endDate,
      },
    })

    if (payload.status === 'claimed') {
      await emitWebhookEvent({
        tenantId: context.tenantId,
        event: WEBHOOK_EVENTS.warrantyClaimed,
        payload: updated,
      })
    }

    return { previous, updated }
  }

  return { unsupported: true }
}

async function deleteResource(resource, id, context) {
  const config = PUBLIC_API_RESOURCES[resource]
  if (!config) {
    return { unsupported: true }
  }

  const previous = await prisma[config.model].findFirst({
    where: { id, tenantId: context.tenantId },
  })

  if (!previous) {
    return { notFound: true }
  }

  await prisma[config.model].delete({
    where: { id },
  })

  return { previous }
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

export async function DELETE(req, { params }) {
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

    const result = await deleteResource(resource, id, auth.context)

    if (result.notFound) {
      return errorResponse('Registro no encontrado.', 404)
    }

    if (result.unsupported) {
      return errorResponse('Este recurso no admite eliminación en esta versión.', 400)
    }

    await createAuditLog({
      tenantId: auth.context.tenantId,
      userId: auth.context.actingUserId,
      action: `${resource}.deleted`,
      entity: resource,
      entityId: id,
      oldData: result.previous,
      ipAddress: auth.context.ipAddress,
      userAgent: auth.context.userAgent,
    })

    return jsonResponse({ success: true, id }, 200, auth.headers)
  } catch (error) {
    console.error('Error eliminando detalle público:', error)
    return errorResponse(error.message || 'No se pudo eliminar el registro solicitado.')
  }
}
