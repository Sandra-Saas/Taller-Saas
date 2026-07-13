import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'

export async function GET() {
  try {
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
    return errorResponse('Failed to fetch subscriptions')
  }
}
