import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { requireTenantContext } from '../../../../lib/request-context'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'
import {
  buildCopilotSnapshot,
  executeCopilotProposal,
  planCopilotResponse,
  saveAIQueryLog,
} from '../../../../lib/ai-copilot'

export const dynamic = 'force-dynamic'

function getActionEntity(action) {
  switch (action) {
    case 'create_client':
      return 'Client'
    case 'create_vehicle':
      return 'Vehicle'
    case 'create_turn':
      return 'CalendarEvent'
    case 'create_work_order':
    case 'update_work_order_status':
      return 'WorkOrder'
    case 'create_quotation':
      return 'Quotation'
    default:
      return 'AICopilotAction'
  }
}

function buildExecutionMessage(action, result) {
  switch (action) {
    case 'create_client':
      return `Cliente ${result.firstName} ${result.lastName} creado correctamente.`
    case 'create_vehicle':
      return `Vehículo ${result.brand} ${result.model}${result.plate ? ` · ${result.plate}` : ''} registrado para ${result.client.firstName} ${result.client.lastName}.`
    case 'create_turn':
      return `Turno agendado para ${new Date(result.startDate).toLocaleString('es-AR')}.`
    case 'create_work_order':
      return `Orden de trabajo OT ${result.number} creada correctamente.`
    case 'create_quotation':
      return `Presupuesto ${result.number} generado en borrador.`
    case 'update_work_order_status':
      return `Orden OT ${result.number} actualizada al estado ${result.status}.`
    default:
      return 'Acción ejecutada correctamente.'
  }
}

function normalizeErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'No se pudo procesar la solicitud del Copilot.'
}

export async function POST(req) {
  let context = null
  let requestBody = null

  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    context = tenantResult.context
    const protection = protectInternalMutation({
      req,
      scope: 'ai-copilot:post',
      actorKey: getActorKeyFromContext(context),
      max: 30,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    requestBody = await readSanitizedJson(req)

    const query = sanitizeString(requestBody?.query)
    const confirm = requestBody?.confirm === true
    const proposal = requestBody?.proposal || null

    if (!confirm && !query) {
      return errorResponse('Ingresá una instrucción para el Copilot.', 400)
    }

    if (confirm) {
      if (!proposal?.action) {
        return errorResponse('No hay una propuesta pendiente para confirmar.', 400)
      }

      const result = await executeCopilotProposal({
        tenantId: context.tenantId,
        proposal,
      })
      const response = buildExecutionMessage(proposal.action, result)
      const snapshot = await buildCopilotSnapshot(context.tenantId)

      await Promise.all([
        createAuditLog({
          tenantId: context.tenantId,
          userId: context.actingUserId,
          action: `ai.copilot.${proposal.action}`,
          entity: getActionEntity(proposal.action),
          entityId: result?.id || null,
          newData: {
            proposal,
            resultId: result?.id || null,
            resultNumber: result?.number || null,
            resultStatus: result?.status || null,
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        }),
        saveAIQueryLog({
          tenantId: context.tenantId,
          userId: context.actingUserId,
          query: query || proposal.summary || proposal.label || proposal.action,
          response,
          type: 'copilot_execution',
        }),
      ])

      return jsonResponse({
        type: 'execution',
        response,
        proposal,
        result,
        snapshot,
      })
    }

    const planned = await planCopilotResponse({
      tenantId: context.tenantId,
      query,
    })

    await saveAIQueryLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      query,
      response: planned.response,
      type: planned.type === 'proposal' ? 'copilot_proposal' : 'copilot_answer',
      tokensUsed: planned.tokensUsed,
    })

    return jsonResponse(planned)
  } catch (error) {
    const message = normalizeErrorMessage(error)
    console.error('Error in AI copilot route:', error)

    if (context?.tenantId && requestBody?.query) {
      await saveAIQueryLog({
        tenantId: context.tenantId,
        userId: context.actingUserId,
        query: String(requestBody.query),
        response: message,
        type: 'copilot_error',
      }).catch(() => null)
    }

    return errorResponse(message, 500)
  }
}
