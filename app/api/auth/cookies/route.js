import { jsonResponse, errorResponse } from '../../../../lib/api'
import {
  buildClearedSessionCookieHeaders,
  buildSessionCookieHeaders,
} from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

function respondWithCookies(payload, cookieHeaders, status = 200) {
  const response = jsonResponse(payload, status)

  for (const cookie of cookieHeaders) {
    response.headers.append('Set-Cookie', cookie)
  }

  return response
}

export async function POST(req) {
  try {
    const payload = await req.json()
    const accessToken = String(payload?.accessToken || '').trim()
    const expiresAt = payload?.expiresAt ? Number(payload.expiresAt) : 0

    if (!accessToken) {
      return errorResponse('No se recibió un access token válido para la sesión.', 400)
    }

    return respondWithCookies(
      { success: true },
      buildSessionCookieHeaders(
        {
          accessToken,
          expiresAt: Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : null,
        },
        { url: req.url }
      )
    )
  } catch (error) {
    console.error('Error setting auth cookies:', error)
    return errorResponse('No se pudieron persistir las cookies de sesión.')
  }
}

export async function DELETE(req) {
  return respondWithCookies(
    { success: true },
    buildClearedSessionCookieHeaders({ url: req.url })
  )
}
