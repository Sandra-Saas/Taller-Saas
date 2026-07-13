import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAMES } from '@/lib/auth'

export function middleware(request) {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value
  const expiresAt = Number(request.cookies.get(AUTH_COOKIE_NAMES.expiresAt)?.value || 0)
  const isExpired = expiresAt > 0 && expiresAt <= Math.floor(Date.now() / 1000)

  if (!accessToken || isExpired) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
