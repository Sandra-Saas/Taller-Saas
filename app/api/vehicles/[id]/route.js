import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { requireTenantContext } from '../../../../lib/request-context'
import { readSanitizedJson, sanitizeString, toSafeInteger } from '../../../../lib/request-security'

export const dynamic = 'force-dynamic'

const vehicleInclude = {
  client: true,
  documents: true,
  receptions: true,
  workOrders: true,
  statusLogs: true,
}

async function findVehicleById(id, tenantId) {
  return prisma.vehicle.findFirst({
    where: { id, tenantId },
    include: vehicleInclude,
  })
}

export async function GET(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const vehicle = await findVehicleById(params.id, context.tenantId)

    if (!vehicle) {
      return errorResponse('No encontré el vehículo solicitado.', 404)
    }

    return jsonResponse(vehicle)
  } catch (error) {
    console.error('Error fetching vehicle:', error)
    return errorResponse('No se pudo obtener el vehículo.')
  }
}

export async function PUT(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { id: params.id, tenantId: context.tenantId },
    })

    if (!existingVehicle) {
      return errorResponse('No encontré el vehículo solicitado.', 404)
    }

    const data = await readSanitizedJson(req)
    let clientId = existingVehicle.clientId

    if (Object.prototype.hasOwnProperty.call(data, 'clientId') && data.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          tenantId: context.tenantId,
        },
      })

      if (!client) {
        return errorResponse('El cliente indicado no pertenece al tenant actual.', 400)
      }

      clientId = client.id
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: existingVehicle.id },
      data: {
        brand: Object.prototype.hasOwnProperty.call(data, 'brand')
          ? sanitizeString(data.brand) || existingVehicle.brand
          : undefined,
        model: Object.prototype.hasOwnProperty.call(data, 'model')
          ? sanitizeString(data.model) || existingVehicle.model
          : undefined,
        plate: Object.prototype.hasOwnProperty.call(data, 'plate')
          ? sanitizeString(data.plate) || null
          : undefined,
        year: Object.prototype.hasOwnProperty.call(data, 'year')
          ? data.year
            ? toSafeInteger(data.year, 0) || null
            : null
          : undefined,
        vin: Object.prototype.hasOwnProperty.call(data, 'vin')
          ? sanitizeString(data.vin) || null
          : undefined,
        engine: Object.prototype.hasOwnProperty.call(data, 'engine')
          ? sanitizeString(data.engine) || null
          : undefined,
        chassis: Object.prototype.hasOwnProperty.call(data, 'chassis')
          ? sanitizeString(data.chassis) || null
          : undefined,
        color: Object.prototype.hasOwnProperty.call(data, 'color')
          ? sanitizeString(data.color) || null
          : undefined,
        mileage: Object.prototype.hasOwnProperty.call(data, 'mileage')
          ? data.mileage
            ? toSafeInteger(data.mileage, 0) || null
            : null
          : undefined,
        fuel: Object.prototype.hasOwnProperty.call(data, 'fuel')
          ? sanitizeString(data.fuel) || null
          : undefined,
        notes: Object.prototype.hasOwnProperty.call(data, 'notes')
          ? sanitizeString(data.notes) || null
          : undefined,
        clientId,
      },
      include: {
        client: true,
      },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'vehicle.updated',
      entity: 'Vehicle',
      entityId: vehicle.id,
      oldData: existingVehicle,
      newData: {
        brand: vehicle.brand,
        model: vehicle.model,
        plate: vehicle.plate,
        clientId: vehicle.clientId,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(vehicle)
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return errorResponse('No se pudo actualizar el vehículo.')
  }
}

export async function DELETE(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { id: params.id, tenantId: context.tenantId },
    })

    if (!existingVehicle) {
      return errorResponse('No encontré el vehículo solicitado.', 404)
    }

    await prisma.vehicle.delete({
      where: { id: existingVehicle.id },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'vehicle.deleted',
      entity: 'Vehicle',
      entityId: existingVehicle.id,
      oldData: existingVehicle,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse({ message: 'Vehículo eliminado correctamente.' })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return errorResponse('No se pudo eliminar el vehículo.')
  }
}
