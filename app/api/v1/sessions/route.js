import { jsonResponse, errorResponse } from '../../../../lib/api'
import { requireTenantContext } from '../../../../lib/request-context'
import { listTenantSessions } from '../../../../lib/session-tracker'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const data = await listTenantSessions({
      tenantId: context.tenantId,
      currentSessionToken: context.sessionToken,
    })

    return jsonResponse(data)
  } catch (error) {
    console.error('Error fetching tenant sessions:', error)
    return errorResponse('No se pudieron obtener las sesiones activas.')
  }
}
