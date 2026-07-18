import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { requireTenantContext } from '../../../../lib/request-context'
import { readSanitizedJson, sanitizeString, toSafeInteger, toSafeNumber } from '../../../../lib/request-security'

export const dynamic = 'force-dynamic'

async function findServiceById(id, tenantId) {
  return prisma.service.findFirst({
    where: { id, tenantId },
  })
}

export async function GET(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const service = await findServiceById(params.id, context.tenantId)

    if (!service) {
      return errorResponse('No encontré el servicio solicitado.', 404)
    }

    return jsonResponse(service)
  } catch (error) {
    console.error('Error fetching service:', error)
    return errorResponse('No se pudo obtener el servicio.')
  }
}

export async function PUT(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const existingService = await findServiceById(params.id, context.tenantId)

    if (!existingService) {
      return errorResponse('No encontré el servicio solicitado.', 404)
    }

    const data = await readSanitizedJson(req)
    const service = await prisma.service.update({
      where: { id: existingService.id },
      data: {
        name: Object.prototype.hasOwnProperty.call(data, 'name')
          ? sanitizeString(data.name) || existingService.name
          : undefined,
        description: Object.prototype.hasOwnProperty.call(data, 'description')
          ? sanitizeString(data.description) || null
          : undefined,
        duration: Object.prototype.hasOwnProperty.call(data, 'duration')
          ? Math.max(1, toSafeInteger(data.duration, existingService.duration))
          : undefined,
        price: Object.prototype.hasOwnProperty.call(data, 'price')
          ? toSafeNumber(data.price, Number(existingService.price))
          : undefined,
        active: Object.prototype.hasOwnProperty.call(data, 'active')
          ? data.active === true
          : undefined,
      },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'service.updated',
      entity: 'Service',
      entityId: service.id,
      oldData: existingService,
      newData: {
        name: service.name,
        duration: service.duration,
        active: service.active,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(service)
  } catch (error) {
    console.error('Error updating service:', error)
    return errorResponse('No se pudo actualizar el servicio.')
  }
}

export async function DELETE(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const existingService = await findServiceById(params.id, context.tenantId)

    if (!existingService) {
      return errorResponse('No encontré el servicio solicitado.', 404)
    }

    await prisma.service.delete({
      where: { id: existingService.id },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'service.deleted',
      entity: 'Service',
      entityId: existingService.id,
      oldData: existingService,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse({ message: 'Servicio eliminado correctamente.' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return errorResponse('No se pudo eliminar el servicio.')
  }
}
