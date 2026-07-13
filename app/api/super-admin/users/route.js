import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'

// GET /api/super-admin/users - Get all users
export async function GET(req) {
  try {
    const users = await prisma.user.findMany({
      include: {
        tenant: { select: { id: true, commercialName: true } },
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return jsonResponse(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return errorResponse('Failed to fetch users')
  }
}

// POST /api/super-admin/users - Create user (for super admin)
export async function POST(req) {
  try {
    const data = await req.json()
    const { tenantId, firstName, lastName, email, password, roleId, status } = data

    if (!tenantId || !firstName || !lastName || !email || !roleId) {
      return errorResponse('Missing required fields', 400)
    }

    const user = await prisma.user.create({
      data: {
        tenantId,
        firstName,
        lastName,
        email,
        password: password || '', // TODO: Hash password properly!
        roleId,
        status: status || 'active',
      },
      include: {
        tenant: true,
        role: true,
      },
    })

    return jsonResponse(user, 201)
  } catch (error) {
    console.error('Error creating user:', error)
    if (error.code === 'P2002') {
      return errorResponse('Email already exists', 400)
    }
    return errorResponse('Failed to create user')
  }
}
