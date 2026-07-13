export const AUTH_COOKIE_NAMES = {
  accessToken: 'taller-access-token',
  expiresAt: 'taller-session-expires-at',
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`]

  if (options.maxAge) {
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

  return parts.join('; ')
}

function isSecureContext() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.location.protocol === 'https:'
}

export function persistSessionCookies(session) {
  if (typeof document === 'undefined') {
    return
  }

  if (!session?.access_token) {
    clearSessionCookies()
    return
  }

  const secure = isSecureContext()

  document.cookie = buildCookie(AUTH_COOKIE_NAMES.accessToken, session.access_token, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'Lax',
    secure,
  })

  if (session.expires_at) {
    document.cookie = buildCookie(AUTH_COOKIE_NAMES.expiresAt, String(session.expires_at), {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'Lax',
      secure,
    })
  }
}

export function clearSessionCookies() {
  if (typeof document === 'undefined') {
    return
  }

  const secure = isSecureContext()

  document.cookie = buildCookie(AUTH_COOKIE_NAMES.accessToken, '', {
    maxAge: 0,
    path: '/',
    sameSite: 'Lax',
    secure,
  })

  document.cookie = buildCookie(AUTH_COOKIE_NAMES.expiresAt, '', {
    maxAge: 0,
    path: '/',
    sameSite: 'Lax',
    secure,
  })
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
