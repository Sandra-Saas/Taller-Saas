import prisma from './prisma'
import { errorResponse } from './api'
import { SUPER_ADMIN_COOKIE_NAMES } from './auth'
import { verifyJWT } from './jwt-utils'

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const separatorIndex = entry.indexOf('=')
      if (separatorIndex === -1) {
        return acc
      }

      const key = entry.slice(0, separatorIndex)
      const value = entry.slice(separatorIndex + 1)
      acc[key] = decodeURIComponent(value)
      return acc
    }, {})
}

function getTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.get('cookie') || '')
  return cookies[SUPER_ADMIN_COOKIE_NAMES.accessToken] || null
}

function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('fly-client-ip') ||
    null
  )
}

export async function requireSuperAdminContext(req) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return {
        ok: false,
        error: errorResponse('No hay una sesión válida de super administrador.', 401),
      }
    }

    // Intentar verificar como JWT de super admin primero
    const payload = verifyJWT(token)
    
    if (payload?.type === 'super_admin') {
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { email: payload.email }
      })

      if (!superAdmin || superAdmin.status !== 'active') {
        return {
          ok: false,
          error: errorResponse('No tenés permisos de super administrador para esta operación.', 403),
        }
      }

      return {
        ok: true,
        context: {
          email: payload.email,
          id: payload.id,
          type: 'super_admin',
          ipAddress: getClientIp(req),
          userAgent: req.headers.get('user-agent') || null,
          superAdmin,
        },
      }
    }

    // Si no es un token de super admin válido, rechazar
    return {
      ok: false,
      error: errorResponse('No hay una sesión válida de super administrador.', 401),
    }
  } catch (error) {
    console.error('Error en requireSuperAdminContext:', error)
    return {
      ok: false,
      error: errorResponse('Error al validar la sesión.', 500),
    }
  }
}
