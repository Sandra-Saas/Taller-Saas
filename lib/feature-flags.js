import prisma from './prisma'

const DEFAULT_FEATURE_FLAGS = [
  {
    key: 'ai_copilot',
    name: 'Copilot IA',
    description: 'Habilita el asistente operativo con propuestas y confirmación.',
    type: 'boolean',
    defaultValue: 'true',
    isPublic: false,
  },
  {
    key: 'public_api',
    name: 'API Premium',
    description: 'Activa los endpoints públicos versionados y su documentación.',
    type: 'boolean',
    defaultValue: 'true',
    isPublic: false,
  },
  {
    key: 'custom_domain',
    name: 'Dominio personalizado',
    description: 'Permite branding con dominio propio por empresa.',
    type: 'boolean',
    defaultValue: 'false',
    isPublic: false,
  },
  {
    key: 'advanced_observability',
    name: 'Observabilidad avanzada',
    description: 'Expone paneles y métricas ampliadas para operaciones.',
    type: 'boolean',
    defaultValue: 'true',
    isPublic: false,
  },
  {
    key: 'pwa_offline',
    name: 'Modo offline PWA',
    description: 'Reserva la experiencia offline y sincronización progresiva.',
    type: 'boolean',
    defaultValue: 'false',
    isPublic: false,
  },
]

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value
  }

  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  return ['true', '1', 'yes', 'si', 'sí', 'on'].includes(normalized)
}

function normalizeScalarValue(type, value) {
  if (type === 'number') {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : 0
  }

  if (type === 'boolean') {
    return parseBoolean(value)
  }

  return String(value ?? '')
}

function serializeScalarValue(type, value) {
  if (type === 'number') {
    return String(Number(value || 0))
  }

  if (type === 'boolean') {
    return normalizeScalarValue(type, value) ? 'true' : 'false'
  }

  return String(value ?? '')
}

function parseStoredOverride(type, rawValue) {
  if (!rawValue) {
    return {
      value: normalizeScalarValue(type, ''),
      conditions: { plan: '', environment: '' },
      note: '',
    }
  }

  try {
    const parsed = JSON.parse(rawValue)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        value: normalizeScalarValue(type, parsed.value),
        conditions: {
          plan: parsed.conditions?.plan || '',
          environment: parsed.conditions?.environment || '',
        },
        note: parsed.note || '',
      }
    }
  } catch {}

  return {
    value: normalizeScalarValue(type, rawValue),
    conditions: { plan: '', environment: '' },
    note: '',
  }
}

function serializeOverrideValue(type, override = {}) {
  return JSON.stringify({
    value: normalizeScalarValue(type, override.value),
    conditions: {
      plan: override.conditions?.plan || '',
      environment: override.conditions?.environment || '',
    },
    note: override.note || '',
  })
}

function mapOverrideRecord(record, type) {
  const parsed = parseStoredOverride(type, record.value)

  return {
    id: record.id,
    tenantId: record.tenantId,
    userId: record.userId,
    isActive: record.isActive,
    value: parsed.value,
    conditions: parsed.conditions,
    note: parsed.note,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

function matchesOverrideConditions(override, plan, environment) {
  const planCondition = override.conditions?.plan || ''
  const environmentCondition = override.conditions?.environment || ''

  if (planCondition && planCondition !== plan) {
    return false
  }

  if (environmentCondition && environmentCondition !== environment) {
    return false
  }

  return true
}

function resolveEffectiveFlag(flag, tenantOverride, userOverride, context) {
  const defaultValue = normalizeScalarValue(flag.type, flag.defaultValue)
  const activeUserOverride =
    userOverride && userOverride.isActive && matchesOverrideConditions(userOverride, context.plan, context.environment)
      ? userOverride
      : null
  const activeTenantOverride =
    tenantOverride && tenantOverride.isActive && matchesOverrideConditions(tenantOverride, context.plan, context.environment)
      ? tenantOverride
      : null

  if (activeUserOverride) {
    return {
      value: activeUserOverride.value,
      source: 'user',
    }
  }

  if (activeTenantOverride) {
    return {
      value: activeTenantOverride.value,
      source: 'tenant',
    }
  }

  return {
    value: defaultValue,
    source: 'default',
  }
}

export async function ensureFeatureFlagsSeeded() {
  await Promise.all(
    DEFAULT_FEATURE_FLAGS.map((flag) =>
      prisma.featureFlag.upsert({
        where: { key: flag.key },
        create: flag,
        update: {
          name: flag.name,
          description: flag.description,
          type: flag.type,
          defaultValue: flag.defaultValue,
          isPublic: flag.isPublic,
        },
      })
    )
  )
}

export async function getFeatureFlagsDashboardData({ tenantId, userId = null, plan = '', environment = 'development' }) {
  await ensureFeatureFlagsSeeded()

  const [flags, users] = await Promise.all([
    prisma.featureFlag.findMany({
      include: {
        values: {
          where: {
            OR: [{ tenantId }, { userId: { not: null }, tenantId }],
          },
          orderBy: [{ updatedAt: 'desc' }],
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    }),
    prisma.user.findMany({
      where: { tenantId },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
  ])

  const mappedFlags = flags.map((flag) => {
    const tenantValueRecord = flag.values.find((entry) => entry.tenantId === tenantId && entry.userId === null) || null
    const currentUserRecord = userId
      ? flag.values.find((entry) => entry.userId === userId && entry.tenantId === tenantId) || null
      : null
    const userOverrides = flag.values
      .filter((entry) => entry.userId)
      .map((entry) => ({
        ...mapOverrideRecord(entry, flag.type),
        user: users.find((user) => user.id === entry.userId) || null,
      }))

    const tenantOverride = tenantValueRecord ? mapOverrideRecord(tenantValueRecord, flag.type) : null
    const effective = resolveEffectiveFlag(flag, tenantOverride, currentUserRecord ? mapOverrideRecord(currentUserRecord, flag.type) : null, {
      plan,
      environment,
    })

    return {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      type: flag.type,
      defaultValue: normalizeScalarValue(flag.type, flag.defaultValue),
      isPublic: flag.isPublic,
      effectiveValue: effective.value,
      effectiveSource: effective.source,
      tenantOverride,
      userOverrides,
    }
  })

  return {
    environment,
    flags: mappedFlags,
    users,
  }
}

export async function createFeatureFlag(input = {}) {
  const type = ['boolean', 'number', 'string'].includes(input.type) ? input.type : 'boolean'
  const key = String(input.key || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')

  if (!key) {
    throw new Error('La key del feature flag es obligatoria.')
  }

  return prisma.featureFlag.create({
    data: {
      key,
      name: String(input.name || key).trim(),
      description: String(input.description || '').trim() || null,
      type,
      defaultValue: serializeScalarValue(type, input.defaultValue),
      isPublic: input.isPublic === true,
    },
  })
}

export async function saveFeatureFlagConfig({ tenantId, flagId, payload }) {
  const flag = await prisma.featureFlag.findUnique({
    where: { id: flagId },
  })

  if (!flag) {
    throw new Error('No encontré el feature flag solicitado.')
  }

  const nextDefaultValue = serializeScalarValue(flag.type, payload.defaultValue)
  const tenantOverride = payload.tenantOverride || null
  const userOverrides = Array.isArray(payload.userOverrides) ? payload.userOverrides : []

  await prisma.featureFlag.update({
    where: { id: flagId },
    data: {
      name: String(payload.name || flag.name).trim() || flag.name,
      description: String(payload.description || '').trim() || null,
      defaultValue: nextDefaultValue,
      isPublic: payload.isPublic === true,
    },
  })

  const existingUserOverrides = await prisma.featureFlagValue.findMany({
    where: {
      flagId,
      tenantId,
      userId: { not: null },
    },
    select: { id: true, userId: true },
  })

  if (tenantOverride) {
    await prisma.featureFlagValue.upsert({
      where: {
        flagId_tenantId_userId: {
          flagId,
          tenantId,
          userId: null,
        },
      },
      create: {
        flagId,
        tenantId,
        userId: null,
        isActive: tenantOverride.isActive !== false,
        value: serializeOverrideValue(flag.type, tenantOverride),
      },
      update: {
        isActive: tenantOverride.isActive !== false,
        value: serializeOverrideValue(flag.type, tenantOverride),
      },
    })
  } else {
    await prisma.featureFlagValue.deleteMany({
      where: {
        flagId,
        tenantId,
        userId: null,
      },
    })
  }

  const incomingUserIds = userOverrides
    .map((entry) => entry.userId)
    .filter(Boolean)

  const staleUserOverrideIds = existingUserOverrides
    .filter((entry) => !incomingUserIds.includes(entry.userId))
    .map((entry) => entry.id)

  if (staleUserOverrideIds.length > 0) {
    await prisma.featureFlagValue.deleteMany({
      where: { id: { in: staleUserOverrideIds } },
    })
  }

  for (const override of userOverrides) {
    if (!override.userId) {
      continue
    }

    await prisma.featureFlagValue.upsert({
      where: {
        flagId_tenantId_userId: {
          flagId,
          tenantId,
          userId: override.userId,
        },
      },
      create: {
        flagId,
        tenantId,
        userId: override.userId,
        isActive: override.isActive !== false,
        value: serializeOverrideValue(flag.type, override),
      },
      update: {
        isActive: override.isActive !== false,
        value: serializeOverrideValue(flag.type, override),
      },
    })
  }

  return prisma.featureFlag.findUnique({
    where: { id: flagId },
  })
}

export async function isFeatureEnabled({ key, tenantId, userId = null, plan = '', environment = 'development' }) {
  await ensureFeatureFlagsSeeded()

  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    include: {
      values: {
        where: {
          OR: [
            { tenantId, userId: null },
            ...(userId ? [{ tenantId, userId }] : []),
          ],
        },
      },
    },
  })

  if (!flag) {
    return false
  }

  const tenantOverrideRecord = flag.values.find((entry) => entry.tenantId === tenantId && entry.userId === null) || null
  const userOverrideRecord = userId
    ? flag.values.find((entry) => entry.userId === userId && entry.tenantId === tenantId) || null
    : null

  const tenantOverride = tenantOverrideRecord ? mapOverrideRecord(tenantOverrideRecord, flag.type) : null
  const userOverride = userOverrideRecord ? mapOverrideRecord(userOverrideRecord, flag.type) : null
  const resolved = resolveEffectiveFlag(flag, tenantOverride, userOverride, { plan, environment })

  return flag.type === 'boolean' ? Boolean(resolved.value) : resolved.value
}
