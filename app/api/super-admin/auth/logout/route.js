import { jsonResponse } from '@/lib/api'
import { AUTH_COOKIE_NAMES } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    
    // Eliminar cookies de autenticación
    cookieStore.delete(AUTH_COOKIE_NAMES.accessToken)
    cookieStore.delete(AUTH_COOKIE_NAMES.expiresAt)

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('Error en logout de super admin:', error)
    return jsonResponse(
      { error: 'Error al cerrar sesión' },
      500
    )
  }
}
