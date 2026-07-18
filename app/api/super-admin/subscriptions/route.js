import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { requireSuperAdminContext } from '../../../../lib/super-admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const subscriptions = await prisma.subscription.findMany({
      include: {
        tenant: { select: { id: true, commercialName: true } },
        plan: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return jsonResponse(subscriptions)
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return errorResponse('No se pudieron obtener las suscripciones.')
  }
}
