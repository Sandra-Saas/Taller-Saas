import { jsonResponse, errorResponse } from '../../../../lib/api'
import { requireTenantContext } from '../../../../lib/request-context'
import { planCopilotResponse, saveAIQueryLog } from '../../../../lib/ai-copilot'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const data = await req.json()
    const query = String(data?.query || '').trim()

    if (!query) {
      return errorResponse('Ingresá una consulta para el asistente.', 400)
    }

    const result = await planCopilotResponse({
      tenantId: context.tenantId,
      query,
    })

    await saveAIQueryLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      query,
      response: result.response,
      type: 'assistant',
      tokensUsed: result.tokensUsed,
    })

    return jsonResponse({
      response: result.response,
      type: result.type,
      proposal: result.proposal || null,
      snapshot: result.snapshot,
    })
  } catch (error) {
    console.error('Error generating AI response:', error)
    return errorResponse('No se pudo generar la respuesta del asistente.')
  }
}
