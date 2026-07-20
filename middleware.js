import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAMES, SUPER_ADMIN_COOKIE_NAMES } from '@/lib/auth'

export function middleware(request) {
  // Permitir acceso sin autenticación a /super-admin/login
  if (request.nextUrl.pathname === '/super-admin/login') {
    return NextResponse.next()
  }

  const isSuperAdminRoute = request.nextUrl.pathname.startsWith('/super-admin')
  const cookieNames = isSuperAdminRoute ? SUPER_ADMIN_COOKIE_NAMES : AUTH_COOKIE_NAMES
  const accessToken = request.cookies.get(cookieNames.accessToken)?.value
  const expiresAt = Number(request.cookies.get(cookieNames.expiresAt)?.value || 0)
  const isExpired = expiresAt > 0 && expiresAt <= Math.floor(Date.now() / 1000)

  if (!accessToken || isExpired) {
    // Si intenta acceder a /super-admin, redirigir a /super-admin/login
    if (request.nextUrl.pathname.startsWith('/super-admin')) {
      const loginUrl = new URL('/super-admin/login', request.url)
      loginUrl.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Si intenta acceder a /dashboard, redirigir a /login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/super-admin/:path*'],
}
