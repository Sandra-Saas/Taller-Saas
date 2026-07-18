import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { requireTenantContext } from '../../../../lib/request-context'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'

export const dynamic = 'force-dynamic'

function buildDefaultConfig(context) {
  return {
    brandName: context?.tenant?.commercialName || context?.tenant?.businessName || 'Taller SaaS',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    logoUrl: '',
    faviconUrl: '',
    customDomain: '',
    customLoginText: '',
    customEmailFrom: '',
    isActive: true,
  }
}

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req)
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const currentConfig = await prisma.whiteLabelConfig.findUnique({
      where: { tenantId: context.tenantId },
    })

    return jsonResponse({
      ...buildDefaultConfig(context),
      ...(currentConfig || {}),
    })
  } catch (error) {
    console.error('Error fetching white-label config:', error)
    return errorResponse('No se pudo obtener la configuración White Label.')
  }
}

export async function PUT(req) {
  try {
    const tenantResult = await requireTenantContext(req)
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const protection = protectInternalMutation({
      req,
      scope: 'white-label:update',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const payload = await readSanitizedJson(req)
    const previousConfig = await prisma.whiteLabelConfig.findUnique({
      where: { tenantId: context.tenantId },
    })

    const nextConfig = await prisma.whiteLabelConfig.upsert({
      where: { tenantId: context.tenantId },
      create: {
        tenantId: context.tenantId,
        brandName: sanitizeString(payload.brandName) || context.tenant?.commercialName || 'Taller SaaS',
        primaryColor: sanitizeString(payload.primaryColor) || '#6366f1',
        secondaryColor: sanitizeString(payload.secondaryColor) || '#8b5cf6',
        logoUrl: sanitizeString(payload.logoUrl) || null,
        faviconUrl: sanitizeString(payload.faviconUrl) || null,
        customDomain: sanitizeString(payload.customDomain) || null,
        customLoginText: sanitizeString(payload.customLoginText) || null,
        customEmailFrom: sanitizeString(payload.customEmailFrom) || null,
        isActive: payload.isActive !== false,
      },
      update: {
        brandName: sanitizeString(payload.brandName) || context.tenant?.commercialName || 'Taller SaaS',
        primaryColor: sanitizeString(payload.primaryColor) || '#6366f1',
        secondaryColor: sanitizeString(payload.secondaryColor) || '#8b5cf6',
        logoUrl: sanitizeString(payload.logoUrl) || null,
        faviconUrl: sanitizeString(payload.faviconUrl) || null,
        customDomain: sanitizeString(payload.customDomain) || null,
        customLoginText: sanitizeString(payload.customLoginText) || null,
        customEmailFrom: sanitizeString(payload.customEmailFrom) || null,
        isActive: payload.isActive !== false,
      },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'white_label.updated',
      entity: 'WhiteLabelConfig',
      entityId: nextConfig.id,
      oldData: previousConfig,
      newData: nextConfig,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(nextConfig, 200, protection.headers)
  } catch (error) {
    console.error('Error saving white-label config:', error)
    return errorResponse('No se pudo guardar la configuración White Label.')
  }
}
