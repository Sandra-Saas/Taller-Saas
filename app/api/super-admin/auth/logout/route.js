import { jsonResponse } from '@/lib/api'
import { buildClearedSuperAdminSessionCookieHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const response = jsonResponse({ success: true })

    for (const cookie of buildClearedSuperAdminSessionCookieHeaders({ url: req.url })) {
      response.headers.append('Set-Cookie', cookie)
    }

    return response
  } catch (error) {
    console.error('Error en logout de super admin:', error)
    return jsonResponse(
      { error: 'Error al cerrar sesión' },
      500
    )
  }
}
