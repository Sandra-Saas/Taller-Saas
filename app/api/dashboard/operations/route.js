import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { requireTenantContext } from '../../../../lib/request-context'
import { summarizeVehicleOperations } from '../../../../lib/dashboard-metrics'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const tenantId = context.tenantId

    const vehiclesForStatus = await prisma.vehicle.findMany({
      where: { tenantId },
      select: {
        id: true,
        receptions: {
          select: { id: true },
          take: 1,
        },
        workOrders: {
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        quotations: {
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        statusLogs: {
          select: { status: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    const { vehicleStatusSummary, vehiclePipeline } = summarizeVehicleOperations(vehiclesForStatus)

    return jsonResponse({
      general: vehicleStatusSummary,
      operations: {
        vehiclePipeline,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard operations:', error)
    return errorResponse('No se pudo obtener el pipeline operativo del dashboard.')
  }
}
