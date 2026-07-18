import { errorResponse } from './api'
import { checkRateLimit } from './rate-limit'

function getExpectedOrigin(req) {
  try {
    return new URL(req.url).origin
  } catch {
    return null
  }
}

function normalizeOrigin(value) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function requireSameOrigin(req, options = {}) {
  const { allowMissingOrigin = false } = options
  const expectedOrigin = getExpectedOrigin(req)

  if (!expectedOrigin) {
    return { ok: true }
  }

  const origin = normalizeOrigin(req.headers.get('origin'))
  const referer = normalizeOrigin(req.headers.get('referer'))
  const candidate = origin || referer

  if (!candidate) {
    if (allowMissingOrigin) {
      return { ok: true }
    }

    return {
      ok: false,
      error: errorResponse('La solicitud fue bloqueada por protección CSRF.', 403),
    }
  }

  if (candidate !== expectedOrigin) {
    return {
      ok: false,
      error: errorResponse('El origen de la solicitud no es válido para esta operación.', 403),
    }
  }

  return { ok: true }
}

export function enforceInternalRateLimit({
  scope,
  actorKey,
  max = 20,
  windowMs = 60_000,
}) {
  const result = checkRateLimit({
    key: `internal:${scope}:${actorKey || 'anonymous'}`,
    max,
    windowMs,
  })

  const headers = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
  }

  if (!result.allowed) {
    return {
      ok: false,
      headers,
      error: errorResponse('Demasiadas solicitudes para esta operación. Intentá de nuevo en unos segundos.', 429, headers),
    }
  }

  return {
    ok: true,
    headers,
  }
}

export function getActorKeyFromContext(context = {}, fallback = '') {
  return (
    context?.actingUserId ||
    context?.userId ||
    context?.email ||
    context?.superAdmin?.id ||
    context?.superAdmin?.email ||
    context?.ipAddress ||
    fallback ||
    'anonymous'
  )
}

export function protectInternalMutation({
  req,
  scope,
  actorKey,
  allowMissingOrigin = false,
  max = 20,
  windowMs = 60_000,
}) {
  const originCheck = requireSameOrigin(req, { allowMissingOrigin })
  if (!originCheck.ok) {
    return originCheck
  }

  return enforceInternalRateLimit({
    scope,
    actorKey,
    max,
    windowMs,
  })
}
