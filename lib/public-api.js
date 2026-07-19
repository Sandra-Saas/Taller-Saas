export const PUBLIC_API_RESOURCES = {
  clients: {
    model: 'client',
    readScope: 'clients:read',
    writeScope: 'clients:write',
    orderBy: { createdAt: 'desc' },
    include: {
      phones: true,
      emails: true,
      addresses: true,
      company: true,
      vehicles: true,
      workOrders: true,
    },
  },
  vehicles: {
    model: 'vehicle',
    readScope: 'vehicles:read',
    writeScope: 'vehicles:write',
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      branch: true,
    },
  },
  turns: {
    model: 'calendarEvent',
    readScope: 'turns:read',
    writeScope: 'turns:write',
    orderBy: { startDate: 'desc' },
    include: {
      client: true,
      vehicle: true,
      service: true,
      branch: true,
    },
  },
  receptions: {
    model: 'reception',
    readScope: 'receptions:read',
    writeScope: 'receptions:write',
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      vehicle: true,
      receivedBy: true,
      branch: true,
    },
  },
  quotations: {
    model: 'quotation',
    readScope: 'quotations:read',
    writeScope: 'quotations:write',
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      vehicle: true,
      items: true,
    },
  },
  'work-orders': {
    model: 'workOrder',
    readScope: 'work-orders:read',
    writeScope: 'work-orders:write',
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      vehicle: true,
      tasks: true,
      materials: true,
    },
  },
  inventory: {
    model: 'inventoryItem',
    readScope: 'inventory:read',
    writeScope: 'inventory:write',
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      supplier: true,
      branch: true,
    },
  },
  pos: {
    model: 'posTransaction',
    readScope: 'pos:read',
    writeScope: 'pos:write',
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      cashier: true,
      items: true,
      branch: true,
    },
  },
  invoices: {
    model: 'invoice',
    readScope: 'invoices:read',
    writeScope: 'invoices:write',
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      workOrder: true,
      items: true,
    },
  },
  warranties: {
    model: 'warranty',
    readScope: 'warranties:read',
    writeScope: 'warranties:write',
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      vehicle: true,
      workOrder: true,
      invoice: true,
    },
  },
}

const PLAN_RATE_LIMITS = {
  trial: { windowMs: 60 * 1000, max: 30 },
  basic: { windowMs: 60 * 1000, max: 60 },
  profesional: { windowMs: 60 * 1000, max: 180 },
  professional: { windowMs: 60 * 1000, max: 180 },
  premium: { windowMs: 60 * 1000, max: 360 },
  enterprise: { windowMs: 60 * 1000, max: 900 },
  default: { windowMs: 60 * 1000, max: 60 },
}

export const WEBHOOK_EVENTS = {
  clientCreated: 'client.created',
  vehicleCreated: 'vehicle.created',
  turnCreated: 'turn.created',
  receptionCreated: 'reception.created',
  quotationApproved: 'quotation.approved',
  workOrderFinished: 'work-order.finished',
  paymentReceived: 'payment.received',
  invoiceGenerated: 'invoice.generated',
  posCreated: 'pos.created',
  warrantyClaimed: 'warranty.claimed',
}

export function normalizePlanName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function getPlanRateLimit(planName) {
  return PLAN_RATE_LIMITS[normalizePlanName(planName)] || PLAN_RATE_LIMITS.default
}

export function hasScope(scopes, requiredScope) {
  if (!requiredScope) {
    return true
  }

  if (!Array.isArray(scopes)) {
    return false
  }

  if (scopes.includes('*') || scopes.includes(requiredScope)) {
    return true
  }

  const [domain, action] = requiredScope.split(':')
  return scopes.includes(`${domain}:*`) || scopes.includes(`*:${action}`)
}

export function getListParams(req) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 25), 1), 100)
  const cursor = searchParams.get('cursor')
  const status = searchParams.get('status')
  const q = searchParams.get('q')
  const clientId = searchParams.get('clientId')
  const vehicleId = searchParams.get('vehicleId')

  return {
    limit,
    cursor,
    status,
    q,
    clientId,
    vehicleId,
  }
}

export function buildOpenApiSpec(baseUrl = 'http://localhost:3000') {
  return {
    openapi: '3.1.0',
    info: {
      title: 'TallerSaas Premium API',
      version: '1.0.0',
      description:
        'API pública versionada para clientes Premium y Enterprise. Autentica con API Key Bearer y registra auditoría, rate limiting y webhooks.',
    },
    servers: [{ url: `${baseUrl}/api/public/v1` }],
    components: {
      securitySchemes: {
        bearerApiKey: {
          type: 'http',
          scheme: 'bearer',
          description: 'Usa una API Key generada desde Configuración > API Keys.',
        },
        bearerJwt: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Compatibilidad con JWT del sistema para operaciones internas y futuras integraciones.',
        },
        oauth2Future: {
          type: 'oauth2',
          description: 'Esquema preparado para futuras integraciones OAuth 2.0.',
          flows: {
            authorizationCode: {
              authorizationUrl: `${baseUrl}/oauth/authorize`,
              tokenUrl: `${baseUrl}/oauth/token`,
              scopes: {
                'clients:read': 'Leer clientes',
                'clients:write': 'Crear clientes',
                'vehicles:read': 'Leer vehículos',
                'vehicles:write': 'Crear vehículos',
              },
            },
          },
        },
      },
    },
    security: [{ bearerApiKey: [] }, { bearerJwt: [] }],
    paths: {
      '/clients': {
        get: { summary: 'Listar clientes' },
        post: { summary: 'Crear cliente' },
      },
      '/vehicles': {
        get: { summary: 'Listar vehículos' },
        post: { summary: 'Crear vehículo' },
      },
      '/turns': {
        get: { summary: 'Listar turnos' },
        post: { summary: 'Crear turno' },
      },
      '/quotations': {
        get: { summary: 'Listar presupuestos' },
      },
      '/work-orders': {
        get: { summary: 'Listar órdenes de trabajo' },
      },
      '/inventory': {
        get: { summary: 'Listar inventario' },
      },
      '/invoices': {
        get: { summary: 'Listar facturación' },
      },
      '/stats': {
        get: { summary: 'Consultar estadísticas ejecutivas' },
      },
      '/reports': {
        get: { summary: 'Consultar reportes programados y alertas' },
      },
      '/{resource}/{id}': {
        get: { summary: 'Obtener un registro por ID' },
        patch: { summary: 'Actualizar estado o registrar pagos operativos' },
      },
    },
  }
}
