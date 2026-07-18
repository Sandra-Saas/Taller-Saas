import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'
import { requireSuperAdminContext } from '../../../../lib/super-admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const notifications = await prisma.globalNotification.findMany({
      include: { createdBy: true },
      orderBy: { createdAt: 'desc' },
    })
    return jsonResponse(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return errorResponse('No se pudieron obtener las notificaciones.')
  }
}

export async function POST(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { context } = authResult
    const protection = protectInternalMutation({
      req,
      scope: 'super-admin:notifications:create',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const data = await readSanitizedJson(req)
    const { title, message, type, targetType, targetData } = data

    if (!title || !message || !targetType) {
      return errorResponse('Título, mensaje y tipo de destino son obligatorios.', 400)
    }

    const notification = await prisma.globalNotification.create({
      data: {
        title: sanitizeString(title),
        message: sanitizeString(message),
        type: sanitizeString(type) || 'info',
        targetType: sanitizeString(targetType),
        targetData: targetData || {},
        createdById: context.superAdmin.id,
      },
      include: { createdBy: true },
    })

    return jsonResponse(notification, 201, protection.headers)
  } catch (error) {
    console.error('Error creating notification:', error)
    return errorResponse('No se pudo crear la notificación.')
  }
}
