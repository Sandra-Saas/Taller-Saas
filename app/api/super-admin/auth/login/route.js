import { jsonResponse } from '@/lib/api'
import { verifyPassword } from '@/lib/passwords'
import prisma from '@/lib/prisma'
import { buildSuperAdminSessionCookieHeaders } from '@/lib/auth'
import { createJWT } from '@/lib/jwt-utils'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return jsonResponse(
        { error: 'Email y contraseña son requeridos' },
        400
      )
    }

    // Buscar el super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    })

    if (!superAdmin) {
      return jsonResponse(
        { error: 'Credenciales inválidas' },
        401
      )
    }

    if (superAdmin.status !== 'active') {
      return jsonResponse(
        { error: 'Esta cuenta de super admin está inactiva' },
        403
      )
    }

    // Verificar contraseña
    const passwordValid = verifyPassword(password, superAdmin.password)
    if (!passwordValid) {
      return jsonResponse(
        { error: 'Credenciales inválidas' },
        401
      )
    }

    // Actualizar último login
    await prisma.superAdmin.update({
      where: { id: superAdmin.id },
      data: { lastLoginAt: new Date() }
    })

    // Crear JWT con formato compatible
    const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 7 // 7 días
    const token = createJWT({
      type: 'super_admin',
      id: superAdmin.id,
      email: superAdmin.email,
      iat: Math.floor(Date.now() / 1000),
      exp: expiresAt
    })

    const response = jsonResponse({
      success: true,
      superAdmin: {
        id: superAdmin.id,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        email: superAdmin.email
      }
    })

    for (const cookie of buildSuperAdminSessionCookieHeaders(
      { accessToken: token, expiresAt },
      { url: req.url }
    )) {
      response.headers.append('Set-Cookie', cookie)
    }

    return response
  } catch (error) {
    console.error('Error en login de super admin:', error)
    return jsonResponse(
      { error: 'Error interno del servidor' },
      500
    )
  }
}
