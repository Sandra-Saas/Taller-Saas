import prisma from '../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../lib/api'
import { createAuditLog } from '../../../lib/audit'
import { requireTenantContext } from '../../../lib/request-context'
import { readSanitizedJson, sanitizeString, toSafeInteger, toSafeNumber } from '../../../lib/request-security'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const services = await prisma.service.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { name: 'asc' },
    })

    return jsonResponse(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return errorResponse('No se pudieron obtener los servicios.')
  }
}

export async function POST(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const data = await readSanitizedJson(req)
    const name = sanitizeString(data.name)

    if (!name) {
      return errorResponse('El nombre del servicio es obligatorio.', 400)
    }

    const service = await prisma.service.create({
      data: {
        tenantId: context.tenantId,
        name,
        description: sanitizeString(data.description) || null,
        duration: Math.max(1, toSafeInteger(data.duration, 60)),
        price: toSafeNumber(data.price, 0),
        active: data.active !== false,
      },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'service.created',
      entity: 'Service',
      entityId: service.id,
      newData: {
        name: service.name,
        duration: service.duration,
        active: service.active,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(service, 201)
  } catch (error) {
    console.error('Error creating service:', error)
    return errorResponse('No se pudo crear el servicio.')
  }
}
