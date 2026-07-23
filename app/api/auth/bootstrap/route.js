import { randomUUID } from 'crypto'
import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { AUTH_COOKIE_NAMES } from '../../../../lib/auth'
import { hashPassword } from '../../../../lib/passwords'
import { decodeJwtPayload } from '../../../../lib/request-context'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'

export const dynamic = 'force-dynamic'

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

function readSessionToken(req) {
  const cookies = parseCookies(req.headers.get('cookie') || '')
  return cookies[AUTH_COOKIE_NAMES.accessToken] || null
}

function buildAccountSeed(email) {
  const localPart = String(email || '')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()

  const normalizedName = localPart || 'Mi taller'
  const words = normalizedName.split(/\s+/).filter(Boolean)
  const firstName = words[0] ? words[0][0].toUpperCase() + words[0].slice(1) : 'Usuario'
  const lastName =
    words.length > 1
      ? words
          .slice(1)
          .join(' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : 'Principal'
  const commercialName = normalizedName
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .slice(0, 80)

  return {
    firstName,
    lastName,
    businessName: `Taller ${commercialName}`.slice(0, 120),
    commercialName: commercialName || 'Mi taller',
    cuit: `AUTO-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
  }
}

function addTrialDays(days) {
  const startDate = new Date()
  const trialEndDate = new Date(startDate)
  trialEndDate.setDate(trialEndDate.getDate() + days)
  return { startDate, trialEndDate }
}

async function resolveBootstrapPlan() {
  const existingPlan =
    (await prisma.plan.findFirst({ where: { status: 'active' }, orderBy: { createdAt: 'asc' } })) ||
    (await prisma.plan.findFirst({ orderBy: { createdAt: 'asc' } }))

  if (existingPlan) {
    return {
      plan: existingPlan,
      createdFallback: false,
    }
  }

  const fallbackPlan = await prisma.plan.create({
    data: {
      name: 'Trial',
      description: 'Plan autogenerado para bootstrap de cuentas autenticadas.',
      status: 'active',
      maxUsers: 3,
      basePrice: 0,
      ivaPercentage: 21,
      ivaAmount: 0,
      finalPrice: 0,
      benefits: [
        'Acceso inicial al dashboard',
        'CRUD operativo basico',
        'Provisionamiento automatico',
      ],
    },
  })

  return {
    plan: fallbackPlan,
    createdFallback: true,
  }
}

export async function POST(req) {
  try {
    const payload = await readSanitizedJson(req).catch(() => ({}))
    const sessionToken = readSessionToken(req)
    const tokenPayload = decodeJwtPayload(sessionToken)
    const emailFromToken = sanitizeString(tokenPayload?.email).toLowerCase()
    const emailFromBody = sanitizeString(payload?.email).toLowerCase()
    const email = emailFromToken || emailFromBody

    if (!email) {
      return errorResponse('No se pudo identificar el email autenticado para bootstrap.', 400)
    }

    if (emailFromToken && emailFromBody && emailFromToken !== emailFromBody) {
      return errorResponse('El email autenticado no coincide con el solicitado para bootstrap.', 400)
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      include: {
        tenant: true,
        role: true,
      },
    })

    if (existingUser) {
      return jsonResponse({
        provisioned: false,
        tenantId: existingUser.tenantId,
        userId: existingUser.id,
        email: existingUser.email,
      })
    }

    const { plan } = await resolveBootstrapPlan()

    if (!plan) {
      return errorResponse('No hay un plan disponible para provisionar la cuenta.', 500)
    }

    const seed = buildAccountSeed(email)
    const password = sanitizeString(payload?.password)
    const { startDate, trialEndDate } = addTrialDays(14)

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          businessName: seed.businessName,
          commercialName: seed.commercialName,
          cuit: seed.cuit,
          ivaCondition: 'Consumidor Final',
          country: 'Argentina',
          email,
          planId: plan.id,
          status: 'active',
        },
      })

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'trial',
          startDate,
          trialEndDate,
          autoRenew: true,
        },
      })

      const role = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Administrador',
          description: 'Rol inicial autoprovisionado para la cuenta.',
          isSystem: true,
        },
      })

      const user = await tx.user.create({
        data: {
          firstName: seed.firstName,
          lastName: seed.lastName,
          email,
          password: hashPassword(password || randomUUID()),
          status: 'active',
          tenantId: tenant.id,
          roleId: role.id,
        },
        include: {
          tenant: true,
          role: true,
        },
      })

      return {
        tenant,
        role,
        user,
      }
    })

    return jsonResponse({
      provisioned: true,
      tenantId: result.tenant.id,
      userId: result.user.id,
      email: result.user.email,
    })
  } catch (error) {
    console.error('Error bootstrapping authenticated account:', error)

    if (error?.code === 'P2002') {
      return errorResponse('No se pudo provisionar la cuenta porque ya existen datos duplicados.', 400)
    }

    return errorResponse('No se pudo bootstrapear la cuenta autenticada.')
  }
}
