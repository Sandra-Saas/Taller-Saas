import prisma from '../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../lib/api'
import { createAuditLog } from '../../../lib/audit'
import { requireTenantContext } from '../../../lib/request-context'
import { readSanitizedJson, sanitizeString, toSafeInteger } from '../../../lib/request-security'

export const dynamic = 'force-dynamic'

const vehicleInclude = {
  client: true,
  documents: true,
}

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId: context.tenantId },
      include: vehicleInclude,
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse(vehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return errorResponse('No se pudieron obtener los vehículos.')
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
    const brand = sanitizeString(data.brand)
    const model = sanitizeString(data.model)

    if (!brand || !model || !data.clientId) {
      return errorResponse('Marca, modelo y cliente son obligatorios para crear el vehículo.', 400)
    }

    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        tenantId: context.tenantId,
      },
    })

    if (!client) {
      return errorResponse('El cliente indicado no pertenece al tenant actual.', 400)
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        brand,
        model,
        clientId: client.id,
        tenantId: context.tenantId,
        plate: sanitizeString(data.plate) || null,
        year: data.year ? toSafeInteger(data.year, 0) || null : null,
        vin: sanitizeString(data.vin) || null,
        engine: sanitizeString(data.engine) || null,
        chassis: sanitizeString(data.chassis) || null,
        color: sanitizeString(data.color) || null,
        fuel: sanitizeString(data.fuel) || null,
        notes: sanitizeString(data.notes) || null,
        mileage: data.mileage ? toSafeInteger(data.mileage, 0) || null : null,
      },
      include: {
        client: true,
      },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'vehicle.created',
      entity: 'Vehicle',
      entityId: vehicle.id,
      newData: {
        brand: vehicle.brand,
        model: vehicle.model,
        plate: vehicle.plate,
        clientId: vehicle.clientId,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(vehicle, 201)
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return errorResponse('No se pudo crear el vehículo.')
  }
}
