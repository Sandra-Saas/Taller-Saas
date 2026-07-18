import { createHash } from 'crypto'
import prisma from './prisma'

function detectBrowser(userAgent = '') {
  const value = userAgent.toLowerCase()

  if (value.includes('edg/')) return 'Edge'
  if (value.includes('opr/') || value.includes('opera')) return 'Opera'
  if (value.includes('chrome/')) return 'Chrome'
  if (value.includes('safari/') && !value.includes('chrome/')) return 'Safari'
  if (value.includes('firefox/')) return 'Firefox'

  return 'Desconocido'
}

function detectOS(userAgent = '') {
  const value = userAgent.toLowerCase()

  if (value.includes('windows')) return 'Windows'
  if (value.includes('android')) return 'Android'
  if (value.includes('iphone') || value.includes('ipad') || value.includes('ios')) return 'iOS'
  if (value.includes('mac os') || value.includes('macintosh')) return 'macOS'
  if (value.includes('linux')) return 'Linux'

  return 'Desconocido'
}

export function hashSessionToken(token) {
  return createHash('sha256').update(String(token || '')).digest('hex')
}

export function buildDeviceInfo(userAgent = '', providedInfo = {}) {
  return {
    browser: detectBrowser(userAgent),
    os: detectOS(userAgent),
    deviceLabel: providedInfo?.deviceLabel || null,
    platform: providedInfo?.platform || null,
    language: providedInfo?.language || null,
  }
}

function mapSessionRecord(record, currentSessionHash) {
  return {
    id: record.id,
    userId: record.userId,
    tenantId: record.tenantId,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    expiresAt: record.expiresAt,
    lastActivityAt: record.lastActivityAt,
    createdAt: record.createdAt,
    isCurrent: Boolean(currentSessionHash && record.token === currentSessionHash),
    deviceInfo: record.deviceInfo || {},
    user: record.user
      ? {
          id: record.user.id,
          firstName: record.user.firstName,
          lastName: record.user.lastName,
          email: record.user.email,
        }
      : null,
  }
}

export async function syncSessionRecord({ context, sessionToken, expiresAt = null, deviceInfo = null }) {
  if (!context?.tenantId || !context?.userId || !sessionToken) {
    return null
  }

  const tokenHash = hashSessionToken(sessionToken)
  const nextExpiresAt =
    expiresAt instanceof Date && !Number.isNaN(expiresAt.getTime())
      ? expiresAt
      : context.sessionExpiresAt instanceof Date && !Number.isNaN(context.sessionExpiresAt.getTime())
        ? context.sessionExpiresAt
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const payloadDeviceInfo = buildDeviceInfo(context.userAgent || '', deviceInfo)
  const existingSession = await prisma.session.findFirst({
    where: {
      tenantId: context.tenantId,
      userId: context.userId,
      token: tokenHash,
    },
  })

  if (existingSession) {
    return prisma.session.update({
      where: { id: existingSession.id },
      data: {
        expiresAt: nextExpiresAt,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceInfo: payloadDeviceInfo,
        lastActivityAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })
  }

  return prisma.session.create({
    data: {
      tenantId: context.tenantId,
      userId: context.userId,
      token: tokenHash,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceInfo: payloadDeviceInfo,
      expiresAt: nextExpiresAt,
      lastActivityAt: new Date(),
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  })
}

export async function listTenantSessions({ tenantId, currentSessionToken = null }) {
  const currentSessionHash = currentSessionToken ? hashSessionToken(currentSessionToken) : null
  const sessions = await prisma.session.findMany({
    where: {
      tenantId,
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
  })

  const mappedSessions = sessions.map((record) => mapSessionRecord(record, currentSessionHash))

  return {
    sessions: mappedSessions,
    summary: {
      total: mappedSessions.length,
      active: mappedSessions.filter((entry) => new Date(entry.expiresAt).getTime() > Date.now()).length,
      currentSessionId: mappedSessions.find((entry) => entry.isCurrent)?.id || null,
    },
  }
}

export async function removeSessionRecord({ tenantId, sessionId = null, sessionToken = null }) {
  if (sessionId) {
    return prisma.session.deleteMany({
      where: {
        id: sessionId,
        tenantId,
      },
    })
  }

  if (sessionToken) {
    return prisma.session.deleteMany({
      where: {
        tenantId,
        token: hashSessionToken(sessionToken),
      },
    })
  }

  return { count: 0 }
}

export async function isSessionActive({ tenantId, sessionToken, touch = false }) {
  if (!tenantId || !sessionToken) {
    return { active: false, session: null }
  }

  const session = await prisma.session.findFirst({
    where: {
      tenantId,
      token: hashSessionToken(sessionToken),
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  })

  if (!session) {
    return { active: false, session: null }
  }

  const isActive = new Date(session.expiresAt).getTime() > Date.now()

  if (touch && isActive) {
    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: {
        lastActivityAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    return {
      active: true,
      session: mapSessionRecord(updatedSession, hashSessionToken(sessionToken)),
    }
  }

  return {
    active: isActive,
    session: mapSessionRecord(session, hashSessionToken(sessionToken)),
  }
}
