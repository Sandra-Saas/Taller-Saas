import prisma from '../../../../../lib/prisma'
import { createAuditLog } from '../../../../../lib/audit'
import { errorResponse, jsonResponse } from '../../../../../lib/api'
import { getPlanRateLimit, getListParams, hasScope, PUBLIC_API_RESOURCES, WEBHOOK_EVENTS } from '../../../../../lib/public-api'
import { checkRateLimit } from '../../../../../lib/rate-limit'
import { getRequestContext } from '../../../../../lib/request-context'
import { emitWebhookEvent } from '../../../../../lib/webhooks'

export const dynamic = 'force-dynamic'

function getRateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  }
}

async function authorizeRequest(req, requiredScope) {
  const context = await getRequestContext(req)
  if (!context?.tenantId) {
    return { error: errorResponse('API no autenticada.', 401) }
  }

  if (!hasScope(context.scopes || ['*'], requiredScope)) {
    return { error: errorResponse('La credencial actual no tiene alcance suficiente.', 403) }
  }

  const limits = getPlanRateLimit(context.tenant?.plan?.name || context.tokenPayload?.plan)
  const key = `${context.tenantId}:${context.apiKey?.id || context.userId || context.ipAddress || 'public'}:${requiredScope}`
  const rateLimit = checkRateLimit({
    key,
    windowMs: limits.windowMs,
    max: limits.max,
  })

  if (!rateLimit.allowed) {
    return {
      error: errorResponse('Rate limit excedido para el plan actual.', 429, getRateLimitHeaders(rateLimit)),
    }
  }

  return {
    context,
    rateLimitHeaders: getRateLimitHeaders(rateLimit),
  }
}

function buildSearchWhere(resource, params, tenantId) {
  const where = { tenantId }
  const { status, q, clientId, vehicleId } = params

  if (status) {
    where.status = status
  }

  if (clientId) {
    where.clientId = clientId
  }

  if (vehicleId) {
    where.vehicleId = vehicleId
  }

  if (q) {
    if (resource === 'clients') {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ]
    } else if (resource === 'vehicles') {
      where.OR = [
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { plate: { contains: q, mode: 'insensitive' } },
      ]
    } else if (resource === 'inventory') {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ]
    } else if (resource === 'quotations' || resource === 'work-orders' || resource === 'invoices' || resource === 'receptions' || resource === 'pos') {
      const numericQuery = Number(q)
      if (Number.isFinite(numericQuery)) {
        where.OR = [{ number: numericQuery }]
      }
    }
  }

  return where
}

async function getNextTenantNumber(modelName, tenantId) {
  const latest = await prisma[modelName].findFirst({
    where: { tenantId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })

  return (latest?.number || 0) + 1
}

async function findOwnedRecord(model, id, tenantId) {
  if (!id) {
    return null
  }

  return prisma[model].findFirst({
    where: { id, tenantId },
  })
}

function parseNullableNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

async function getStats(tenantId) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [clients, vehicles, turns, quotations, workOrders, inventoryItems, invoices, monthlyInvoices] = await Promise.all([
    prisma.client.count({ where: { tenantId } }),
    prisma.vehicle.count({ where: { tenantId } }),
    prisma.calendarEvent.count({ where: { tenantId } }),
    prisma.quotation.count({ where: { tenantId } }),
    prisma.workOrder.count({ where: { tenantId } }),
    prisma.inventoryItem.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.invoice.findMany({ where: { tenantId, date: { gte: startOfMonth } } }),
  ])

  const monthlyBilling = monthlyInvoices.reduce((total, invoice) => total + invoice.total.toNumber(), 0)

  return {
    summary: {
      clients,
      vehicles,
      turns,
      quotations,
      workOrders,
      inventoryItems,
      invoices,
      monthlyBilling,
    },
    updatedAt: now.toISOString(),
  }
}

async function getReports(tenantId) {
  const [reports, alerts] = await Promise.all([
    prisma.scheduledReport.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.smartAlert.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return { reports, alerts }
}

async function createResource(resource, payload, context) {
  if (resource === 'clients') {
    const created = await prisma.client.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        birthday: payload.birthday ? new Date(payload.birthday) : null,
        status: payload.status || 'active',
        notes: payload.notes || null,
        tenantId: context.tenantId,
        companyId: payload.companyId || null,
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

    await emitWebhookEvent({
      tenantId: context.tenantId,
      event: WEBHOOK_EVENTS.clientCreated,
      payload: created,
    })

    return created
  }

  if (resource === 'vehicles') {
    const client = await findOwnedRecord('client', payload.clientId, context.tenantId)

    if (!client) {
      throw new Error('Necesito un cliente válido para crear el vehículo.')
    }

    const created = await prisma.vehicle.create({
      data: {
        brand: payload.brand,
        model: payload.model,
        year: parseNullableNumber(payload.year),
        plate: payload.plate || null,
        vin: payload.vin || null,
        engine: payload.engine || null,
        chassis: payload.chassis || null,
        color: payload.color || null,
        mileage: parseNullableNumber(payload.mileage),
        fuel: payload.fuel || null,
        notes: payload.notes || null,
        tenantId: context.tenantId,
        clientId: client.id,
        branchId: payload.branchId || null,
      },
      include: {
        client: true,
        branch: true,
      },
    })

    await emitWebhookEvent({
      tenantId: context.tenantId,
      event: WEBHOOK_EVENTS.vehicleCreated,
      payload: created,
    })

    return created
  }

  if (resource === 'turns') {
    const created = await prisma.calendarEvent.create({
      data: {
        title: payload.title,
        description: payload.description || null,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        type: payload.type || 'appointment',
        status: payload.status || 'scheduled',
        reminder: payload.reminder ? new Date(payload.reminder) : null,
        tenantId: context.tenantId,
        clientId: payload.clientId || null,
        vehicleId: payload.vehicleId || null,
        mechanicId: payload.mechanicId || null,
        serviceId: payload.serviceId || null,
        branchId: payload.branchId || null,
      },
    })

    await emitWebhookEvent({
      tenantId: context.tenantId,
      event: WEBHOOK_EVENTS.turnCreated,
      payload: created,
    })

    return created
  }

  if (resource === 'receptions') {
    const client = await findOwnedRecord('client', payload.clientId, context.tenantId)
    const vehicle = await findOwnedRecord('vehicle', payload.vehicleId, context.tenantId)

    if (!client || !vehicle) {
      throw new Error('Necesito un cliente y un vehículo válidos para crear la recepción.')
    }

    const created = await prisma.reception.create({
      data: {
        number: await getNextTenantNumber('reception', context.tenantId),
        tenantId: context.tenantId,
        clientId: client.id,
        vehicleId: vehicle.id,
        receivedById: context.actingUserId || null,
        date: payload.date ? new Date(payload.date) : new Date(),
        mileage: payload.mileage ? Number(payload.mileage) : null,
        fuelLevel: payload.fuelLevel || null,
        visibleDamages: payload.visibleDamages || null,
        notes: payload.notes || null,
      },
      include: {
        client: true,
        vehicle: true,
        receivedBy: true,
      },
    })

    await emitWebhookEvent({
      tenantId: context.tenantId,
      event: WEBHOOK_EVENTS.receptionCreated,
      payload: created,
    })

    return created
  }

  if (resource === 'quotations') {
    const client = await findOwnedRecord('client', payload.clientId, context.tenantId)
    const vehicle = await findOwnedRecord('vehicle', payload.vehicleId, context.tenantId)

    if (!client || !vehicle) {
      throw new Error('Necesito un cliente y un vehículo válidos para crear el presupuesto.')
    }

    return prisma.quotation.create({
      data: {
        number: await getNextTenantNumber('quotation', context.tenantId),
        tenantId: context.tenantId,
        clientId: client.id,
        vehicleId: vehicle.id,
        status: payload.status || 'draft',
        subtotal: Number(payload.subtotal || 0),
        discount: Number(payload.discount || 0),
        tax: Number(payload.tax || 0),
        total: Number(payload.total || 0),
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
        notes: payload.notes || null,
      },
      include: {
        client: true,
        vehicle: true,
        items: true,
      },
    })
  }

  if (resource === 'work-orders') {
    const client = await findOwnedRecord('client', payload.clientId, context.tenantId)
    const vehicle = await findOwnedRecord('vehicle', payload.vehicleId, context.tenantId)

    if (!client || !vehicle) {
      throw new Error('Necesito un cliente y un vehículo válidos para crear la orden de trabajo.')
    }

    return prisma.workOrder.create({
      data: {
        number: await getNextTenantNumber('workOrder', context.tenantId),
        tenantId: context.tenantId,
        clientId: client.id,
        vehicleId: vehicle.id,
        priority: payload.priority || 'normal',
        status: payload.status || 'pending',
        notes: payload.notes || null,
      },
      include: {
        client: true,
        vehicle: true,
        tasks: true,
        materials: true,
      },
    })
  }

  if (resource === 'inventory') {
    const name = String(payload.name || '').trim()
    const type = String(payload.type || '').trim()

    if (!name || !type) {
      throw new Error('Nombre y tipo son obligatorios para crear el item de inventario.')
    }

    return prisma.inventoryItem.create({
      data: {
        tenantId: context.tenantId,
        name,
        type,
        description: payload.description || null,
        sku: payload.sku || null,
        stock: Number(payload.stock || 0),
        minStock: Number(payload.minStock || 0),
        purchasePrice: Number(payload.purchasePrice || 0),
        salePrice: Number(payload.salePrice || 0),
        location: payload.location || null,
        notes: payload.notes || null,
      },
      include: {
        category: true,
        supplier: true,
        branch: true,
      },
    })
  }

  if (resource === 'pos') {
    const client = payload.clientId
      ? await findOwnedRecord('client', payload.clientId, context.tenantId)
      : null

    if (payload.clientId && !client) {
      throw new Error('El cliente seleccionado no pertenece al tenant actual.')
    }

    const created = await prisma.posTransaction.create({
      data: {
        number: await getNextTenantNumber('posTransaction', context.tenantId),
        tenantId: context.tenantId,
        clientId: client?.id || null,
        cashierId: context.actingUserId || null,
        type: payload.type || 'sale',
        paymentMethod: payload.paymentMethod || 'cash',
        subtotal: Number(payload.subtotal || payload.total || 0),
        discount: Number(payload.discount || 0),
        tax: Number(payload.tax || 0),
        total: Number(payload.total || 0),
        notes: payload.notes || null,
      },
      include: {
        client: true,
        cashier: true,
        items: true,
      },
    })

    await emitWebhookEvent({
      tenantId: context.tenantId,
      event: WEBHOOK_EVENTS.posCreated,
      payload: created,
    })

    return created
  }

  if (resource === 'invoices') {
    const client = await findOwnedRecord('client', payload.clientId, context.tenantId)
    const workOrder = payload.workOrderId
      ? await findOwnedRecord('workOrder', payload.workOrderId, context.tenantId)
      : null

    if (!client) {
      throw new Error('Necesito un cliente válido para crear la factura.')
    }

    const created = await prisma.invoice.create({
      data: {
        number: await getNextTenantNumber('invoice', context.tenantId),
        tenantId: context.tenantId,
        clientId: client.id,
        workOrderId: workOrder?.id || null,
        type: payload.type || 'invoice',
        status: payload.status || 'pending',
        subtotal: Number(payload.subtotal || payload.total || 0),
        discount: Number(payload.discount || 0),
        tax: Number(payload.tax || 0),
        total: Number(payload.total || 0),
        notes: payload.notes || null,
      },
      include: {
        client: true,
        workOrder: true,
        items: true,
      },
    })

    await emitWebhookEvent({
      tenantId: context.tenantId,
      event: WEBHOOK_EVENTS.invoiceGenerated,
      payload: created,
    })

    return created
  }

  if (resource === 'warranties') {
    const client = await findOwnedRecord('client', payload.clientId, context.tenantId)
    const vehicle = await findOwnedRecord('vehicle', payload.vehicleId, context.tenantId)
    const workOrder = payload.workOrderId
      ? await findOwnedRecord('workOrder', payload.workOrderId, context.tenantId)
      : null
    const invoice = payload.invoiceId
      ? await findOwnedRecord('invoice', payload.invoiceId, context.tenantId)
      : null

    if (!client || !vehicle) {
      throw new Error('Necesito un cliente y un vehículo válidos para crear la garantía.')
    }

    const defaultEndDate = new Date()
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 1)

    return prisma.warranty.create({
      data: {
        tenantId: context.tenantId,
        clientId: client.id,
        vehicleId: vehicle.id,
        workOrderId: workOrder?.id || null,
        invoiceId: invoice?.id || null,
        startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
        endDate: payload.endDate ? new Date(payload.endDate) : defaultEndDate,
        status: payload.status || 'active',
        description: payload.description || null,
        claimNotes: payload.claimNotes || null,
      },
      include: {
        client: true,
        vehicle: true,
        workOrder: true,
        invoice: true,
      },
    })
  }

  throw new Error('El recurso solicitado no admite creación en esta versión de la API.')
}

export async function GET(req, { params }) {
  try {
    const { resource } = params

    if (resource === 'stats') {
      const auth = await authorizeRequest(req, 'stats:read')
      if (auth.error) {
        return auth.error
      }

      const data = await getStats(auth.context.tenantId)
      return jsonResponse(data, 200, auth.rateLimitHeaders)
    }

    if (resource === 'reports') {
      const auth = await authorizeRequest(req, 'reports:read')
      if (auth.error) {
        return auth.error
      }

      const data = await getReports(auth.context.tenantId)
      return jsonResponse(data, 200, auth.rateLimitHeaders)
    }

    const config = PUBLIC_API_RESOURCES[resource]
    if (!config) {
      return errorResponse('Recurso no soportado por la API pública.', 404)
    }

    const auth = await authorizeRequest(req, config.readScope)
    if (auth.error) {
      return auth.error
    }

    const listParams = getListParams(req)
    const records = await prisma[config.model].findMany({
      where: buildSearchWhere(resource, listParams, auth.context.tenantId),
      include: config.include,
      orderBy: config.orderBy,
      take: listParams.limit,
    })

    return jsonResponse(
      {
        data: records,
        meta: {
          resource,
          count: records.length,
          limit: listParams.limit,
        },
      },
      200,
      auth.rateLimitHeaders
    )
  } catch (error) {
    console.error('Error en API pública:', error)
    return errorResponse('No se pudo procesar la consulta pública.')
  }
}

export async function POST(req, { params }) {
  try {
    const { resource } = params
    const debugTraceId = req.headers.get('x-debug-trace-id') || null
    const shouldDebugAffectedCreate =
      resource === 'vehicles' || resource === 'turns' || resource === 'receptions'
    const config = PUBLIC_API_RESOURCES[resource]
    if (!config) {
      return errorResponse('Recurso no soportado por la API pública.', 404)
    }

    const auth = await authorizeRequest(req, config.writeScope)
    if (auth.error) {
      // #region debug-point D:public-auth-fail
      if (shouldDebugAffectedCreate) {
        fetch('http://127.0.0.1:7777/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'resource-create-500',
            runId: 'pre',
            hypothesisId: 'D',
            traceId: debugTraceId,
            location: 'app/api/public/v1/[resource]/route.js:POST:authError',
            msg: '[DEBUG] affected create authorization failed',
            data: { resource },
            ts: Date.now(),
          }),
        }).catch(() => {})
      }
      // #endregion
      return auth.error
    }

    const payload = await req.json()
    // #region debug-point D:public-create-start
    if (shouldDebugAffectedCreate) {
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'resource-create-500',
          runId: 'pre',
          hypothesisId: 'D',
          traceId: debugTraceId,
          location: 'app/api/public/v1/[resource]/route.js:POST:beforeCreate',
          msg: '[DEBUG] affected create started in public api',
          data: {
            resource,
            tenantId: auth.context?.tenantId || null,
            authType: auth.context?.authType || null,
            userId: auth.context?.userId || null,
            actingUserId: auth.context?.actingUserId || null,
            payload,
          },
          ts: Date.now(),
        }),
      }).catch(() => {})
    }
    // #endregion
    const created = await createResource(resource, payload, auth.context)
    // #region debug-point D:public-create-success
    if (shouldDebugAffectedCreate) {
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'resource-create-500',
          runId: 'pre',
          hypothesisId: 'D',
          traceId: debugTraceId,
          location: 'app/api/public/v1/[resource]/route.js:POST:afterCreate',
          msg: '[DEBUG] affected create succeeded in public api',
          data: {
            resource,
            createdId: created?.id || null,
          },
          ts: Date.now(),
        }),
      }).catch(() => {})
    }
    // #endregion

    await createAuditLog({
      tenantId: auth.context.tenantId,
      userId: auth.context.actingUserId,
      action: `${resource}.created`,
      entity: resource,
      entityId: created.id,
      newData: created,
      ipAddress: auth.context.ipAddress,
      userAgent: auth.context.userAgent,
    })

    return jsonResponse(created, 201, auth.rateLimitHeaders)
  } catch (error) {
    // #region debug-point D:public-create-catch
    if (
      params?.resource === 'vehicles' ||
      params?.resource === 'turns' ||
      params?.resource === 'receptions'
    ) {
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'resource-create-500',
          runId: 'pre',
          hypothesisId: 'D',
          location: 'app/api/public/v1/[resource]/route.js:POST:catch',
          msg: '[DEBUG] affected create failed in public api',
          data: {
            resource: params?.resource || null,
            errorMessage: error?.message || null,
            errorName: error?.name || null,
          },
          ts: Date.now(),
        }),
      }).catch(() => {})
    }
    // #endregion
    console.error('Error creando recurso público:', error)
    return errorResponse(error.message || 'No se pudo crear el recurso solicitado.')
  }
}
