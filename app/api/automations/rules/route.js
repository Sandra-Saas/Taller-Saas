import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { requireTenantContext } from '../../../../lib/request-context'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const rules = await prisma.automationRule.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse(rules)
  } catch (error) {
    console.error('Error fetching automation rules:', error)
    return errorResponse('No se pudieron obtener las reglas de automatización.')
  }
}

export async function POST(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    if (!context.actingUserId) {
      return errorResponse('No hay un usuario local asociado para crear reglas.', 409)
    }

    const data = await readSanitizedJson(req)
    const name = sanitizeString(data.name)
    const trigger = sanitizeString(data.trigger)

    if (!name || !trigger) {
      return errorResponse('Nombre y trigger son obligatorios para crear la regla.', 400)
    }

    const rule = await prisma.automationRule.create({
      data: {
        name,
        trigger,
        triggerCondition: data.triggerCondition || {},
        actions: Array.isArray(data.actions) ? data.actions : [],
        tenantId: context.tenantId,
        createdById: context.actingUserId,
        isActive: data.isActive !== false,
      },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'automation_rule.created',
      entity: 'AutomationRule',
      entityId: rule.id,
      newData: {
        name: rule.name,
        trigger: rule.trigger,
        isActive: rule.isActive,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(rule, 201)
  } catch (error) {
    console.error('Error creating automation rule:', error)
    return errorResponse('No se pudo crear la regla de automatización.')
  }
}
