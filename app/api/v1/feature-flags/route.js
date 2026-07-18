import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { requireTenantContext } from '../../../../lib/request-context'
import { readSanitizedJson } from '../../../../lib/request-security'
import {
  createFeatureFlag,
  getFeatureFlagsDashboardData,
  saveFeatureFlagConfig,
} from '../../../../lib/feature-flags'

export const dynamic = 'force-dynamic'

function getEnvironmentLabel() {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
}

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const data = await getFeatureFlagsDashboardData({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      plan: context.tenant?.plan?.name || context.tenant?.plan?.id || context.tokenPayload?.plan || '',
      environment: getEnvironmentLabel(),
    })

    return jsonResponse(data)
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return errorResponse('No se pudieron obtener los feature flags.')
  }
}

export async function POST(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const protection = protectInternalMutation({
      req,
      scope: 'feature-flags:create',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const payload = await readSanitizedJson(req)
    const createdFlag = await createFeatureFlag(payload)

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'feature_flag.created',
      entity: 'FeatureFlag',
      entityId: createdFlag.id,
      newData: createdFlag,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    const data = await getFeatureFlagsDashboardData({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      plan: context.tenant?.plan?.name || context.tenant?.plan?.id || context.tokenPayload?.plan || '',
      environment: getEnvironmentLabel(),
    })

    return jsonResponse({
      ...data,
      message: 'Feature flag creado correctamente.',
    }, 201, protection.headers)
  } catch (error) {
    console.error('Error creating feature flag:', error)
    return errorResponse(error instanceof Error ? error.message : 'No se pudo crear el feature flag.', 400)
  }
}

export async function PUT(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const protection = protectInternalMutation({
      req,
      scope: 'feature-flags:update',
      actorKey: getActorKeyFromContext(context),
      max: 20,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const payload = await readSanitizedJson(req)

    if (!payload?.flagId) {
      return errorResponse('El identificador del feature flag es obligatorio.', 400)
    }

    await saveFeatureFlagConfig({
      tenantId: context.tenantId,
      flagId: payload.flagId,
      payload,
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'feature_flag.updated',
      entity: 'FeatureFlag',
      entityId: payload.flagId,
      newData: payload,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    const data = await getFeatureFlagsDashboardData({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      plan: context.tenant?.plan?.name || context.tenant?.plan?.id || context.tokenPayload?.plan || '',
      environment: getEnvironmentLabel(),
    })

    return jsonResponse({
      ...data,
      message: 'Feature flag actualizado correctamente.',
    }, 200, protection.headers)
  } catch (error) {
    console.error('Error updating feature flag:', error)
    return errorResponse(error instanceof Error ? error.message : 'No se pudo actualizar el feature flag.', 400)
  }
}
