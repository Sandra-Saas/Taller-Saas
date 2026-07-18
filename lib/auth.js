export const AUTH_COOKIE_NAMES = {
  accessToken: 'taller-access-token',
  expiresAt: 'taller-session-expires-at',
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`]

  if (typeof options.maxAge === 'number') {
    parts.push(`Max-Age=${options.maxAge}`)
  }

  if (options.path) {
    parts.push(`Path=${options.path}`)
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`)
  }

  if (options.secure) {
    parts.push('Secure')
  }

  if (options.httpOnly) {
    parts.push('HttpOnly')
  }

  return parts.join('; ')
}

export function shouldUseSecureCookies(input = {}) {
  if (input?.protocol) {
    return String(input.protocol).toLowerCase() === 'https'
  }

  if (input?.url) {
    try {
      return new URL(input.url).protocol === 'https:'
    } catch {}
  }

  return process.env.NODE_ENV === 'production'
}

export function buildSessionCookieHeaders(session, options = {}) {
  if (!session?.accessToken) {
    return buildClearedSessionCookieHeaders(options)
  }

  const secure = shouldUseSecureCookies(options)
  const baseOptions = {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'Lax',
    secure,
    httpOnly: true,
  }
  const headers = [
    buildCookie(AUTH_COOKIE_NAMES.accessToken, session.accessToken, baseOptions),
  ]

  if (session.expiresAt) {
    headers.push(buildCookie(AUTH_COOKIE_NAMES.expiresAt, String(session.expiresAt), baseOptions))
  }

  return headers
}

export function buildClearedSessionCookieHeaders(options = {}) {
  const secure = shouldUseSecureCookies(options)
  const baseOptions = {
    maxAge: 0,
    path: '/',
    sameSite: 'Lax',
    secure,
    httpOnly: true,
  }

  return [
    buildCookie(AUTH_COOKIE_NAMES.accessToken, '', baseOptions),
    buildCookie(AUTH_COOKIE_NAMES.expiresAt, '', baseOptions),
  ]
}

export function getTenantFromUser(user) {
  if (!user) {
    return null
  }

  const metadata = user.user_metadata || {}
  const appMetadata = user.app_metadata || {}
  const name =
    metadata.business_name ||
    metadata.commercial_name ||
    metadata.full_name ||
    user.email?.split('@')[0] ||
    'Mi taller'

  return {
    id: metadata.tenant_id || appMetadata.tenant_id || user.id,
    businessName: metadata.business_name || name,
    commercialName: metadata.commercial_name || name,
    email: user.email || '',
    plan: metadata.plan || appMetadata.plan || 'trial',
  }
}

export function getSafeRedirectPath(path) {
  if (!path || typeof path !== 'string') {
    return '/dashboard'
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    return '/dashboard'
  }

  return path
}
