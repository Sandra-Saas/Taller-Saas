import { NextResponse } from 'next/server'

export function middleware(request) {
  // TODO: Implement actual authentication check with Supabase
  // For now, we'll just allow all requests
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
