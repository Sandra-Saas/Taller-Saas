import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'
import { requireSuperAdminContext } from '../../../../lib/super-admin-auth'

export const dynamic = 'force-dynamic'

// GET /api/super-admin/tickets
export async function GET(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

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
    return errorResponse('No se pudieron obtener los tickets.')
  }
}

// POST /api/super-admin/tickets
export async function POST(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { context } = authResult
    const protection = protectInternalMutation({
      req,
      scope: 'super-admin:tickets:create',
      actorKey: getActorKeyFromContext(context),
      max: 20,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const data = await readSanitizedJson(req)
    const { title, description, priority, tenantId, userId } = data

    if (!title || !tenantId) {
      return errorResponse('El título y la empresa son obligatorios.', 400)
    }

    const lastTicket = await prisma.ticket.findFirst({ orderBy: { number: 'desc' } })
    const nextNumber = lastTicket ? lastTicket.number + 1 : 1

    const ticket = await prisma.ticket.create({
      data: {
        title: sanitizeString(title),
        description: sanitizeString(description) || null,
        priority: sanitizeString(priority) || 'normal',
        tenantId,
        userId,
        number: nextNumber,
      },
      include: { tenant: true, user: true },
    })

    return jsonResponse(ticket, 201, protection.headers)
  } catch (error) {
    console.error('Error creating ticket:', error)
    return errorResponse('No se pudo crear el ticket.')
  }
}
