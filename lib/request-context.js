import prisma from './prisma'
import { verifyAPIKey } from './apiKeys'
import { AUTH_COOKIE_NAMES } from './auth'

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

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return Buffer.from(padded, 'base64').toString('utf8')
}

export function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split('.')
    if (!payload) {
      return null
    }

    return JSON.parse(decodeBase64Url(payload))
  } catch {
    return null
  }
}

function readBearerToken(req) {
  const authorization = req.headers.get('authorization') || ''
  if (!authorization.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim()
}

function readSessionToken(req) {
  const cookies = parseCookies(req.headers.get('cookie') || '')
  return cookies[AUTH_COOKIE_NAMES.accessToken] || null
}

function readSessionExpiresAt(req) {
  const cookies = parseCookies(req.headers.get('cookie') || '')
  const rawValue = cookies[AUTH_COOKIE_NAMES.expiresAt]

  if (!rawValue) {
    return null
  }

  const numericValue = Number(rawValue)
  if (!Number.isFinite(numericValue)) {
    return null
  }

  return new Date(numericValue * 1000)
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

function extractIdentityFromPayload(payload) {
  if (!payload) {
    return null
  }

  const metadata = payload.user_metadata || {}
  const appMetadata = payload.app_metadata || {}

  return {
    rawUserId: payload.sub || null,
    email: payload.email || metadata.email || null,
    tenantId: metadata.tenant_id || appMetadata.tenant_id || payload.tenant_id || payload.sub || null,
    plan: metadata.plan || appMetadata.plan || null,
    businessName: metadata.business_name || metadata.commercial_name || null,
  }
}

async function resolveTenant(tenantId) {
  if (!tenantId) {
    return null
  }

  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      plan: true,
      subscription: true,
      whiteLabelConfig: true,
    },
  })
}

async function resolveUser(identity) {
  if (!identity?.email && !identity?.rawUserId) {
    return null
  }

  const candidates = []

  if (identity.email) {
    candidates.push(
      prisma.user.findUnique({
        where: { email: identity.email },
        include: {
          tenant: { include: { plan: true, subscription: true, whiteLabelConfig: true } },
          role: true,
        },
      })
    )
  }

  if (identity.rawUserId) {
    candidates.push(
      prisma.user.findUnique({
        where: { id: identity.rawUserId },
        include: {
          tenant: { include: { plan: true, subscription: true, whiteLabelConfig: true } },
          role: true,
        },
      })
    )
  }

  for (const promise of candidates) {
    const user = await promise
    if (user) {
      return user
    }
  }

  return null
}

async function resolveFallbackUser(tenantId) {
  if (!tenantId) {
    return null
  }

  return prisma.user.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    include: { role: true },
  })
}

export async function getRequestContext(req, options = {}) {
  const { allowApiKey = true, allowUserToken = true } = options
  const ipAddress = getClientIp(req)
  const userAgent = req.headers.get('user-agent') || null
  const bearerToken = readBearerToken(req)

  if (allowApiKey && bearerToken && bearerToken.startsWith('ts_')) {
    const apiKey = await verifyAPIKey(req.headers.get('authorization'))
    if (apiKey) {
      const tenant =
        apiKey.tenant ||
        (await prisma.tenant.findUnique({
          where: { id: apiKey.tenantId },
          include: { plan: true, subscription: true, whiteLabelConfig: true },
        }))
      const actingUser = await resolveFallbackUser(apiKey.tenantId)

      return {
        authType: 'api_key',
        apiKey,
        scopes: Array.isArray(apiKey.scopes) ? apiKey.scopes : ['*'],
        tenantId: apiKey.tenantId,
        tenant,
        userId: apiKey.createdById || actingUser?.id || null,
        actingUserId: apiKey.createdById || actingUser?.id || null,
        user: actingUser || null,
        email: actingUser?.email || null,
        ipAddress,
        userAgent,
      }
    }
  }

  if (!allowUserToken) {
    return null
  }

  const sessionToken = bearerToken && !bearerToken.startsWith('ts_') ? bearerToken : readSessionToken(req)
  const sessionExpiresAt = bearerToken && !bearerToken.startsWith('ts_') ? null : readSessionExpiresAt(req)
  if (!sessionToken) {
    return null
  }

  const identity = extractIdentityFromPayload(decodeJwtPayload(sessionToken))
  if (!identity) {
    return null
  }

  const user = await resolveUser(identity)
  const tenant = user?.tenant || (await resolveTenant(user?.tenantId || identity.tenantId))
  const fallbackUser = user || (await resolveFallbackUser(tenant?.id || identity.tenantId))

  return {
    authType: 'session',
    tenantId: tenant?.id || identity.tenantId || fallbackUser?.tenantId || null,
    tenant: tenant || null,
    userId: user?.id || fallbackUser?.id || identity.rawUserId || null,
    actingUserId: user?.id || fallbackUser?.id || null,
    user: user || fallbackUser || null,
    role: user?.role || fallbackUser?.role || null,
    email: user?.email || fallbackUser?.email || identity.email || null,
    ipAddress,
    userAgent,
    tokenPayload: identity,
    scopes: ['*'],
    sessionToken,
    sessionExpiresAt,
  }
}

export async function requireTenantContext(req, options = {}) {
  const context = await getRequestContext(req, options)
  if (!context?.tenantId) {
    return {
      ok: false,
      error: new Response(
        JSON.stringify({ error: 'No se pudo resolver el tenant autenticado para esta operación.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    }
  }

  return { ok: true, context }
}
