import { errorResponse, jsonResponse } from '../../../../lib/api'
import { getCentralLogs, getObservabilitySnapshot } from '../../../../lib/observability'
import { requireSuperAdminContext } from '../../../../lib/super-admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { searchParams } = new URL(req.url)
    const includeLogs = searchParams.get('includeLogs') === 'true'

    const snapshot = await getObservabilitySnapshot()
    const payload = {
      ...snapshot,
      logs: [],
    }

    if (includeLogs) {
      try {
        payload.logs = await getCentralLogs({
          limit: Number(searchParams.get('limit') || 20),
          source: searchParams.get('source') || 'all',
          search: searchParams.get('search') || '',
          tenantId: searchParams.get('tenantId') || '',
        })
      } catch (error) {
        console.error('Error fetching observability logs:', error)
      }
    }

    return jsonResponse(payload)
  } catch (error) {
    console.error('Error fetching observability snapshot:', error)
    return errorResponse('No se pudo obtener la observabilidad global.')
  }
}
