import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'

export async function GET() {
  try {
    const notifications = await prisma.globalNotification.findMany({
      include: { createdBy: true },
      orderBy: { createdAt: 'desc' },
    })
    return jsonResponse(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return errorResponse('Failed to fetch notifications')
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const { title, message, type, targetType, targetData } = data

    const notification = await prisma.globalNotification.create({
      data: {
        title,
        message,
        type: type || 'info',
        targetType,
        targetData,
        createdById: 'temp', // TODO: replace with actual super admin ID
      },
      include: { createdBy: true },
    })

    return jsonResponse(notification, 201)
  } catch (error) {
    console.error('Error creating notification:', error)
    return errorResponse('Failed to create notification')
  }
}
