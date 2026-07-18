import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { requireTenantContext } from '../../../../lib/request-context'
import {
  isSessionActive,
  removeSessionRecord,
  syncSessionRecord,
} from '../../../../lib/session-tracker'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const result = await isSessionActive({
      tenantId: context.tenantId,
      sessionToken: context.sessionToken,
      touch: true,
    })

    return jsonResponse(result)
  } catch (error) {
    console.error('Error checking session status:', error)
    return errorResponse('No se pudo validar la sesión actual.')
  }
}

export async function POST(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    if (!context.sessionToken) {
      return errorResponse('No hay una sesión autenticada para sincronizar.', 400)
    }

    const protection = protectInternalMutation({
      req,
      scope: 'auth-session:sync',
      actorKey: getActorKeyFromContext(context),
      max: 30,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const payload = await req.json().catch(() => ({}))
    const session = await syncSessionRecord({
      context,
      sessionToken: context.sessionToken,
      expiresAt: payload?.expiresAt ? new Date(payload.expiresAt) : context.sessionExpiresAt,
      deviceInfo: payload?.deviceInfo || null,
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'auth.session.synced',
      entity: 'Session',
      entityId: session?.id || null,
      newData: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse({
      active: true,
      session,
    }, 200, protection.headers)
  } catch (error) {
    console.error('Error syncing current session:', error)
    return errorResponse('No se pudo sincronizar la sesión actual.')
  }
}

export async function DELETE(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const protection = protectInternalMutation({
      req,
      scope: 'auth-session:delete',
      actorKey: getActorKeyFromContext(context),
      max: 20,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const removed = await removeSessionRecord({
      tenantId: context.tenantId,
      sessionToken: context.sessionToken,
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'auth.session.deleted',
      entity: 'Session',
      entityId: null,
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
    console.error('Error deleting current session:', error)
    return errorResponse('No se pudo cerrar la sesión actual.')
  }
}
