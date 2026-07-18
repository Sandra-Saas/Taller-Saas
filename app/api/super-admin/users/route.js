import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { hashPassword } from '../../../../lib/passwords'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'
import { requireSuperAdminContext } from '../../../../lib/super-admin-auth'

export const dynamic = 'force-dynamic'

// GET /api/super-admin/users - Get all users
export async function GET(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

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
    return errorResponse('No se pudieron obtener los usuarios.')
  }
}

// POST /api/super-admin/users - Create user (for super admin)
export async function POST(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { context } = authResult
    const protection = protectInternalMutation({
      req,
      scope: 'super-admin:users:create',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const data = await readSanitizedJson(req)
    const { tenantId, firstName, lastName, email, password, roleId, status } = data

    if (!tenantId || !firstName || !lastName || !email || !roleId) {
      return errorResponse('Faltan campos obligatorios.', 400)
    }

    const hashedPassword = hashPassword(password || crypto.randomUUID())

    const user = await prisma.user.create({
      data: {
        tenantId,
        firstName: sanitizeString(firstName),
        lastName: sanitizeString(lastName),
        email: sanitizeString(email),
        password: hashedPassword,
        roleId,
        status: sanitizeString(status) || 'active',
      },
      include: {
        tenant: true,
        role: true,
      },
    })

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'super_admin.user.created',
      entity: 'User',
      entityId: user.id,
      newData: {
        email: user.email,
        roleId: user.roleId,
        createdBySuperAdminId: context.superAdmin.id,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(user, 201, protection.headers)
  } catch (error) {
    console.error('Error creating user:', error)
    if (error.code === 'P2002') {
      return errorResponse('El email ya existe.', 400)
    }
    return errorResponse('No se pudo crear el usuario.')
  }
}
