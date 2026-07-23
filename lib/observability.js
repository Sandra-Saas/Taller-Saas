import prisma from './prisma'

function normalizeMs(value) {
  return Number.isFinite(value) ? Math.round(value) : null
}

function decimalToNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value.toNumber === 'function') {
    return value.toNumber()
  }

  return Number(value || 0)
}

async function safeExecute(label, operation, fallbackValue) {
  try {
    return await operation()
  } catch (error) {
    console.error(`Observability fallback for ${label}:`, error)
    return fallbackValue
  }
}

function getIntegrationStatus(enabled, detail) {
  return {
    status: enabled ? 'healthy' : 'warning',
    detail,
  }
}

function mapSeverity(type) {
  switch (type) {
    case 'error':
    case 'failed':
    case 'critical':
      return 'critical'
    case 'warning':
      return 'warning'
    default:
      return 'info'
  }
}

export async function getObservabilitySnapshot() {
  const startedAt = Date.now()
  const dbStart = performance.now()
  const databaseHealthy = await safeExecute('database-healthcheck', () => prisma.$queryRaw`SELECT 1`, null)
  const databaseLatencyMs = databaseHealthy ? normalizeMs(performance.now() - dbStart) : null

  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    tenants,
    activeTenants,
    activeSubscriptions,
    suspendedTenants,
    pendingWebhookLogs,
    failedWebhookLogs,
    aiQueries24h,
    sessions24h,
    paymentsMonth,
    globalNotifications,
    smartAlerts,
    apiKeysActive,
    whiteLabelsActive,
  ] = await Promise.all([
    safeExecute('tenants-total', () => prisma.tenant.count(), 0),
    safeExecute('tenants-active', () => prisma.tenant.count({ where: { status: 'active' } }), 0),
    safeExecute('subscriptions-active', () => prisma.subscription.count({ where: { status: 'active' } }), 0),
    safeExecute('tenants-suspended', () => prisma.tenant.count({ where: { status: 'suspended' } }), 0),
    safeExecute('webhooks-pending', () => prisma.webhookLog.count({ where: { status: 'pending' } }), 0),
    safeExecute('webhooks-failed', () => prisma.webhookLog.count({ where: { status: 'failed' } }), 0),
    safeExecute('ai-queries-24h', () => prisma.aiQuery.count({ where: { createdAt: { gte: last24Hours } } }), 0),
    safeExecute('sessions-24h', () => prisma.session.count({ where: { lastActivityAt: { gte: last24Hours } } }), 0),
    safeExecute(
      'payments-month',
      () =>
        prisma.payment.aggregate({
          where: { createdAt: { gte: monthStart }, status: 'approved' },
          _sum: { amount: true },
        }),
      { _sum: { amount: null } }
    ),
    safeExecute('global-notifications', () => prisma.globalNotification.count(), 0),
    safeExecute('smart-alerts-24h', () => prisma.smartAlert.count({ where: { createdAt: { gte: last24Hours } } }), 0),
    safeExecute('api-keys-active', () => prisma.apiKey.count({ where: { isActive: true } }), 0),
    safeExecute('white-labels-active', () => prisma.whiteLabelConfig.count({ where: { isActive: true } }), 0),
  ])

  const monthlyRevenue = decimalToNumber(paymentsMonth?._sum?.amount)

  const system = {
    generatedAt: now.toISOString(),
    responseTimeMs: normalizeMs(Date.now() - startedAt),
    process: {
      uptimeSeconds: normalizeMs(process.uptime()),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    database: {
      status: databaseLatencyMs !== null ? 'healthy' : 'critical',
      latencyMs: databaseLatencyMs,
    },
  }

  const services = {
    server: {
      status: 'healthy',
      detail: 'Instancia Next.js operativa',
    },
    database: {
      status: databaseLatencyMs !== null && databaseLatencyMs < 500 ? 'healthy' : 'warning',
      detail: databaseLatencyMs !== null ? `Consulta de salud en ${databaseLatencyMs} ms` : 'Sin respuesta',
    },
    supabase: getIntegrationStatus(
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Variables públicas detectadas' : 'Faltan variables públicas'
    ),
    storage: getIntegrationStatus(Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), 'Storage basado en Supabase'),
    ai: getIntegrationStatus(aiQueries24h > 0 || Boolean(process.env.OPENAI_API_KEY), `${aiQueries24h} consultas IA en 24h`),
    whatsapp: getIntegrationStatus(Boolean(process.env.WHATSAPP_TOKEN), 'Integración preparada por variables'),
    mercadopago: getIntegrationStatus(Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN), 'Credenciales configurables globalmente'),
    email: getIntegrationStatus(Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST), 'Proveedor de correo configurable'),
  }

  const metrics = {
    tenants: {
      total: tenants,
      active: activeTenants,
      suspended: suspendedTenants,
    },
    subscriptions: {
      active: activeSubscriptions,
      monthlyRevenue,
    },
    usage: {
      aiQueries24h,
      sessions24h,
      apiKeysActive,
      whiteLabelsActive,
      globalNotifications,
      smartAlerts24h: smartAlerts,
    },
    reliability: {
      pendingWebhookLogs,
      failedWebhookLogs,
      databaseLatencyMs,
    },
  }

  return {
    system,
    services,
    metrics,
  }
}

export async function getCentralLogs(filters = {}) {
  const { limit = 50, source = 'all', search = '', tenantId = '' } = filters
  const take = Math.min(Math.max(Number(limit) || 50, 1), 200)

  const [auditLogs, webhookLogs, aiQueries, payments, notifications, sessions] = await Promise.all([
    source === 'all' || source === 'audit'
      ? safeExecute(
          'logs-audit',
          () =>
            prisma.auditLog.findMany({
              where: {
                ...(tenantId ? { tenantId } : {}),
                ...(search
                  ? {
                      OR: [
                        { action: { contains: search, mode: 'insensitive' } },
                        { entity: { contains: search, mode: 'insensitive' } },
                      ],
                    }
                  : {}),
              },
              orderBy: { createdAt: 'desc' },
              take,
            }),
          []
        )
      : Promise.resolve([]),
    source === 'all' || source === 'webhooks'
      ? safeExecute(
          'logs-webhooks',
          () =>
            prisma.webhookLog.findMany({
              where: {
                ...(tenantId ? { tenantId } : {}),
                ...(search ? { event: { contains: search, mode: 'insensitive' } } : {}),
              },
              orderBy: { createdAt: 'desc' },
              take,
            }),
          []
        )
      : Promise.resolve([]),
    source === 'all' || source === 'ai'
      ? safeExecute(
          'logs-ai',
          () =>
            prisma.aiQuery.findMany({
              where: {
                ...(tenantId ? { tenantId } : {}),
                ...(search
                  ? {
                      OR: [
                        { query: { contains: search, mode: 'insensitive' } },
                        { response: { contains: search, mode: 'insensitive' } },
                      ],
                    }
                  : {}),
              },
              orderBy: { createdAt: 'desc' },
              take,
            }),
          []
        )
      : Promise.resolve([]),
    source === 'all' || source === 'payments'
      ? safeExecute(
          'logs-payments',
          () =>
            prisma.payment.findMany({
              where: {
                ...(tenantId ? { tenantId } : {}),
                ...(search ? { operationNumber: { contains: search, mode: 'insensitive' } } : {}),
              },
              orderBy: { createdAt: 'desc' },
              take,
            }),
          []
        )
      : Promise.resolve([]),
    source === 'all' || source === 'notifications'
      ? safeExecute(
          'logs-notifications',
          () =>
            prisma.globalNotification.findMany({
              where: {
                ...(search
                  ? {
                      OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { message: { contains: search, mode: 'insensitive' } },
                      ],
                    }
                  : {}),
              },
              orderBy: { createdAt: 'desc' },
              take,
            }),
          []
        )
      : Promise.resolve([]),
    source === 'all' || source === 'sessions'
      ? safeExecute(
          'logs-sessions',
          () =>
            prisma.session.findMany({
              where: {
                ...(tenantId ? { tenantId } : {}),
                ...(search ? { userAgent: { contains: search, mode: 'insensitive' } } : {}),
              },
              orderBy: { lastActivityAt: 'desc' },
              take,
            }),
          []
        )
      : Promise.resolve([]),
  ])

  const merged = [
    ...auditLogs.map((entry) => ({
      id: `audit-${entry.id}`,
      source: 'audit',
      severity: mapSeverity(entry.action),
      title: `${entry.action} · ${entry.entity}`,
      message: entry.entityId || 'Cambio registrado',
      tenantId: entry.tenantId,
      createdAt: entry.createdAt,
      metadata: entry,
    })),
    ...webhookLogs.map((entry) => ({
      id: `webhook-${entry.id}`,
      source: 'webhooks',
      severity: mapSeverity(entry.status),
      title: `${entry.event}`,
      message: entry.response || `Estado ${entry.status}`,
      tenantId: entry.tenantId,
      createdAt: entry.createdAt,
      metadata: entry,
    })),
    ...aiQueries.map((entry) => ({
      id: `ai-${entry.id}`,
      source: 'ai',
      severity: 'info',
      title: `${entry.type} · consulta IA`,
      message: entry.query.slice(0, 140),
      tenantId: entry.tenantId,
      createdAt: entry.createdAt,
      metadata: entry,
    })),
    ...payments.map((entry) => ({
      id: `payment-${entry.id}`,
      source: 'payments',
      severity: mapSeverity(entry.status),
      title: `Pago ${entry.status}`,
      message: `${entry.currency} ${entry.amount.toString()}`,
      tenantId: entry.tenantId,
      createdAt: entry.createdAt,
      metadata: entry,
    })),
    ...notifications.map((entry) => ({
      id: `notification-${entry.id}`,
      source: 'notifications',
      severity: mapSeverity(entry.type),
      title: entry.title,
      message: entry.message,
      tenantId: null,
      createdAt: entry.createdAt,
      metadata: entry,
    })),
    ...sessions.map((entry) => ({
      id: `session-${entry.id}`,
      source: 'sessions',
      severity: 'info',
      title: 'Actividad de sesión',
      message: entry.userAgent || entry.ipAddress || 'Sesión activa',
      tenantId: entry.tenantId,
      createdAt: entry.lastActivityAt,
      metadata: entry,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, take)

  return merged
}
