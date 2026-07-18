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
    }
  }

  return where
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
    })

    await emitWebhookEvent({
      tenantId: context.tenantId,
      event: WEBHOOK_EVENTS.clientCreated,
      payload: created,
    })

    return created
  }

  if (resource === 'vehicles') {
    const created = await prisma.vehicle.create({
      data: {
        brand: payload.brand,
        model: payload.model,
        year: payload.year || null,
        plate: payload.plate || null,
        vin: payload.vin || null,
        engine: payload.engine || null,
        chassis: payload.chassis || null,
        color: payload.color || null,
        mileage: payload.mileage || null,
        fuel: payload.fuel || null,
        notes: payload.notes || null,
        tenantId: context.tenantId,
        clientId: payload.clientId,
        branchId: payload.branchId || null,
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
    const config = PUBLIC_API_RESOURCES[resource]
    if (!config) {
      return errorResponse('Recurso no soportado por la API pública.', 404)
    }

    const auth = await authorizeRequest(req, config.writeScope)
    if (auth.error) {
      return auth.error
    }

    const payload = await req.json()
    const created = await createResource(resource, payload, auth.context)

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
    console.error('Error creando recurso público:', error)
    return errorResponse(error.message || 'No se pudo crear el recurso solicitado.')
  }
}
