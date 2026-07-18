import prisma from '../../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../../lib/api'
import { createAuditLog } from '../../../../../lib/audit'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../../lib/internal-security'
import { requireTenantContext } from '../../../../../lib/request-context'
import { removeSessionRecord } from '../../../../../lib/session-tracker'

export const dynamic = 'force-dynamic'

export async function DELETE(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const protection = protectInternalMutation({
      req,
      scope: 'sessions:revoke',
      actorKey: getActorKeyFromContext(context),
      max: 20,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const targetSession = await prisma.session.findFirst({
      where: {
        id: params.id,
        tenantId: context.tenantId,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    if (!targetSession) {
      return errorResponse('No encontré la sesión solicitada.', 404)
    }

    const removed = await removeSessionRecord({
      tenantId: context.tenantId,
      sessionId: params.id,
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'session.revoked',
      entity: 'Session',
      entityId: targetSession.id,
      oldData: {
        userId: targetSession.userId,
        ipAddress: targetSession.ipAddress,
        userAgent: targetSession.userAgent,
      },
      newData: {
        removedCount: removed.count || 0,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse({
      success: true,
      removedCount: removed.count || 0,
    }, 200, protection.headers)
  } catch (error) {
    console.error('Error revoking session:', error)
    return errorResponse('No se pudo cerrar la sesión seleccionada.')
  }
}
