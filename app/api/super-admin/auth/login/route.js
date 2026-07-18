import { jsonResponse } from '@/lib/api'
import { verifyPassword } from '@/lib/passwords'
import prisma from '@/lib/prisma'
import { AUTH_COOKIE_NAMES } from '@/lib/auth'
import { createJWT } from '@/lib/jwt-utils'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return jsonResponse(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    })

    if (!superAdmin) {
      return jsonResponse(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    if (superAdmin.status !== 'active') {
      return jsonResponse(
        { error: 'Esta cuenta de super admin está inactiva' },
        { status: 403 }
      )
    }

    // Verificar contraseña
    const passwordValid = verifyPassword(password, superAdmin.password)
    if (!passwordValid) {
      return jsonResponse(
        { error: 'Credenciales inválidas' },
        { status: 401 }
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

    // Configurar cookies
    const cookieStore = await cookies()

    cookieStore.set(AUTH_COOKIE_NAMES.accessToken, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 7
    })

    cookieStore.set(AUTH_COOKIE_NAMES.expiresAt, expiresAt.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 7
    })

    return jsonResponse({
      success: true,
      superAdmin: {
        id: superAdmin.id,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        email: superAdmin.email
      }
    })
  } catch (error) {
    console.error('Error en login de super admin:', error)
    return jsonResponse(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
