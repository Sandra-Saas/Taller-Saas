import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'

// GET /api/super-admin/tickets
export async function GET(req) {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        tenant: { select: { id: true, commercialName: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: true,
        comments: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return jsonResponse(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return errorResponse('Failed to fetch tickets')
  }
}

// POST /api/super-admin/tickets
export async function POST(req) {
  try {
    const data = await req.json()
    const { title, description, priority, tenantId, userId } = data

    const lastTicket = await prisma.ticket.findFirst({ orderBy: { number: 'desc' } })
    const nextNumber = lastTicket ? lastTicket.number + 1 : 1

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'normal',
        tenantId,
        userId,
        number: nextNumber,
      },
      include: { tenant: true, user: true },
    })

    return jsonResponse(ticket, 201)
  } catch (error) {
    console.error('Error creating ticket:', error)
    return errorResponse('Failed to create ticket')
  }
}
