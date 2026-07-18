import { errorResponse, jsonResponse } from '../../../../lib/api'
import { getCentralLogs } from '../../../../lib/observability'
import { requireSuperAdminContext } from '../../../../lib/super-admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { searchParams } = new URL(req.url)
    const logs = await getCentralLogs({
      limit: Number(searchParams.get('limit') || 50),
      source: searchParams.get('source') || 'all',
      search: searchParams.get('search') || '',
      tenantId: searchParams.get('tenantId') || '',
    })

    return jsonResponse(logs)
  } catch (error) {
    console.error('Error fetching central logs:', error)
    return errorResponse('No se pudieron obtener los logs centralizados.')
  }
}
