import prisma from './prisma'

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function approxTokens(text) {
  return Math.max(Math.ceil(String(text || '').length / 4), 1)
}

function splitFullName(fullName) {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ')
  const parts = cleaned.split(' ').filter(Boolean)

  if (parts.length === 0) {
    return { firstName: '', lastName: '' }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Sin apellido' }
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  }
}

function extractQuotedValue(query) {
  const quoted = query.match(/"([^"]+)"/)
  return quoted?.[1] || null
}

function mapWorkOrderStatus(query) {
  const normalized = normalizeText(query)

  if (normalized.includes('complet')) return 'completed'
  if (normalized.includes('cancel')) return 'cancelled'
  if (normalized.includes('progreso') || normalized.includes('in_progress')) return 'in_progress'

  return 'pending'
}

function parseDateTime(query) {
  const isoMatch = query.match(/(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/)
  if (isoMatch) {
    const start = new Date(`${isoMatch[1]}T${isoMatch[2] || '09:00'}:00`)
    if (!Number.isNaN(start.getTime())) {
      return start
    }
  }

  const localMatch = query.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}))?/)
  if (localMatch) {
    const [, day, month, year, hour] = localMatch
    const start = new Date(`${year}-${month}-${day}T${hour || '09:00'}:00`)
    if (!Number.isNaN(start.getTime())) {
      return start
    }
  }

  return null
}

function parsePlate(query) {
  const match = query.match(/\b([A-Z]{2,3}\d{3}[A-Z]{0,2})\b/i)
  return match?.[1]?.toUpperCase() || null
}

function parseYear(query) {
  const match = query.match(/\b(19\d{2}|20\d{2})\b/)
  return match ? Number(match[1]) : null
}

function extractAfterKeyword(query, keywords) {
  const normalized = normalizeText(query)

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword)
    const index = normalized.indexOf(normalizedKeyword)
    if (index !== -1) {
      return query.slice(index + keyword.length).trim()
    }
  }

  return ''
}

async function getNextTenantNumber(modelName, tenantId) {
  const latest = await prisma[modelName].findFirst({
    where: { tenantId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })

  return (latest?.number || 0) + 1
}

async function findClientByReference(tenantId, reference) {
  if (!reference) {
    return null
  }

  const normalized = reference.trim()
  return prisma.client.findFirst({
    where: {
      tenantId,
      OR: [
        { firstName: { contains: normalized, mode: 'insensitive' } },
        { lastName: { contains: normalized, mode: 'insensitive' } },
        {
          AND: normalized.includes(' ')
            ? normalized.split(' ').map((part) => ({
                OR: [
                  { firstName: { contains: part, mode: 'insensitive' } },
                  { lastName: { contains: part, mode: 'insensitive' } },
                ],
              }))
            : [],
        },
      ],
    },
  })
}

async function findVehicleByReference(tenantId, reference) {
  if (!reference) {
    return null
  }

  return prisma.vehicle.findFirst({
    where: {
      tenantId,
      OR: [
        { plate: { equals: reference, mode: 'insensitive' } },
        { brand: { contains: reference, mode: 'insensitive' } },
        { model: { contains: reference, mode: 'insensitive' } },
      ],
    },
    include: { client: true },
  })
}

function toSafeNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value.toNumber === 'function') {
    return value.toNumber()
  }

  return Number(value || 0)
}

async function getLowStockItems(tenantId, options = {}) {
  const { take } = options
  const items = await prisma.inventoryItem.findMany({
    where: {
      tenantId,
      minStock: { gt: 0 },
    },
    orderBy: [{ stock: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      stock: true,
      minStock: true,
    },
  })

  const lowStockItems = items.filter((item) => item.stock <= item.minStock)
  return typeof take === 'number' ? lowStockItems.slice(0, take) : lowStockItems
}

function buildMissingFields(action, payload) {
  const missing = []

  if (action === 'create_client' && !payload.fullName) {
    missing.push('nombre completo')
  }

  if (action === 'create_vehicle') {
    if (!payload.brand) missing.push('marca')
    if (!payload.model) missing.push('modelo')
    if (!payload.clientReference) missing.push('cliente')
  }

  if (action === 'create_turn') {
    if (!payload.startDate) missing.push('fecha y hora')
    if (!payload.title) missing.push('motivo')
  }

  if (action === 'create_work_order') {
    if (!payload.clientReference) missing.push('cliente')
    if (!payload.vehicleReference) missing.push('vehículo o patente')
  }

  if (action === 'create_quotation') {
    if (!payload.clientReference) missing.push('cliente')
    if (!payload.vehicleReference) missing.push('vehículo o patente')
  }

  if (action === 'update_work_order_status') {
    if (!payload.workOrderNumber) missing.push('número de orden')
    if (!payload.status) missing.push('estado')
  }

  return missing
}

export async function getAISettingsWithUsage(tenantId) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [settings, dailyUsage, monthlyUsage] = await Promise.all([
    prisma.aISetting.findUnique({ where: { tenantId } }),
    prisma.aIQuery.aggregate({
      where: { tenantId, createdAt: { gte: startOfDay } },
      _count: true,
      _sum: { tokensUsed: true },
    }),
    prisma.aIQuery.aggregate({
      where: { tenantId, createdAt: { gte: startOfMonth } },
      _count: true,
      _sum: { tokensUsed: true },
    }),
  ])

  const customPrompts = settings?.customPrompts || {}
  const costPer1kInput = Number(customPrompts.costPer1kInput || 0)
  const costPer1kOutput = Number(customPrompts.costPer1kOutput || 0)
  const monthlyTokens = monthlyUsage._sum.tokensUsed || 0
  const estimatedMonthlyCost = Number((((monthlyTokens / 2) / 1000) * costPer1kInput + ((monthlyTokens / 2) / 1000) * costPer1kOutput).toFixed(4))

  return {
    settings: settings || null,
    usage: {
      todayQueries: dailyUsage._count || 0,
      todayTokens: dailyUsage._sum.tokensUsed || 0,
      monthQueries: monthlyUsage._count || 0,
      monthTokens: monthlyUsage._sum.tokensUsed || 0,
      estimatedMonthlyCost,
    },
  }
}

export async function buildCopilotSnapshot(tenantId) {
  const [clients, vehicles, workOrders, lowStockItems, turns, quotations, invoices] = await Promise.all([
    prisma.client.count({ where: { tenantId } }),
    prisma.vehicle.count({ where: { tenantId } }),
    prisma.workOrder.count({ where: { tenantId } }),
    getLowStockItems(tenantId),
    prisma.calendarEvent.count({ where: { tenantId, status: 'scheduled' } }),
    prisma.quotation.count({ where: { tenantId, status: 'draft' } }),
    prisma.invoice.findMany({
      where: { tenantId, status: 'pending' },
      select: { total: true },
      take: 100,
    }),
  ])

  const pendingCash = invoices.reduce((sum, invoice) => sum + toSafeNumber(invoice.total), 0)

  return {
    clients,
    vehicles,
    scheduledTurns: turns,
    draftQuotations: quotations,
    openWorkOrders: workOrders,
    lowStockItems: lowStockItems.length,
    pendingCash,
  }
}

export async function planCopilotResponse({ tenantId, query }) {
  const normalized = normalizeText(query)
  const quotedValue = extractQuotedValue(query)
  const snapshot = await buildCopilotSnapshot(tenantId)

  const proposal = {
    confirmationRequired: true,
    action: null,
    label: '',
    summary: '',
    payload: {},
    missingFields: [],
  }

  if (normalized.includes('crear cliente') || normalized.includes('nuevo cliente')) {
    const fullName = quotedValue || extractAfterKeyword(query, ['crear cliente', 'nuevo cliente', 'cliente'])
    proposal.action = 'create_client'
    proposal.label = 'Crear cliente'
    proposal.payload = { fullName: fullName.trim() }
    proposal.summary = fullName
      ? `Voy a crear el cliente ${fullName.trim()}.`
      : 'Puedo crear un cliente, pero me falta el nombre completo.'
  } else if (normalized.includes('crear vehiculo') || normalized.includes('crear vehículo') || normalized.includes('nuevo vehiculo')) {
    const plate = parsePlate(query)
    const year = parseYear(query)
    const afterKeyword = quotedValue || extractAfterKeyword(query, ['crear vehiculo', 'crear vehículo', 'nuevo vehiculo', 'nuevo vehículo'])
    const clientMatch = query.match(/(?:para|cliente)\s+([a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s]+)/)
    const vehicleParts = afterKeyword.replace(/(?:para|cliente)\s+[a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s]+/i, '').trim().split(/\s+/).filter(Boolean)

    proposal.action = 'create_vehicle'
    proposal.label = 'Crear vehículo'
    proposal.payload = {
      brand: vehicleParts[0] || '',
      model: vehicleParts.slice(1).join(' ') || '',
      plate,
      year,
      clientReference: clientMatch?.[1]?.trim() || '',
    }
    proposal.summary = proposal.payload.brand
      ? `Voy a registrar el vehículo ${proposal.payload.brand} ${proposal.payload.model || ''}`.trim()
      : 'Puedo registrar un vehículo, pero necesito marca, modelo y cliente.'
  } else if (normalized.includes('crear turno') || normalized.includes('agendar') || normalized.includes('nuevo turno')) {
    const startDate = parseDateTime(query)
    const clientMatch = query.match(/(?:para|cliente)\s+([a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s]+)/)
    const vehicleMatch = parsePlate(query)
    proposal.action = 'create_turn'
    proposal.label = 'Crear turno'
    proposal.payload = {
      title: quotedValue || 'Turno generado por Copilot',
      startDate: startDate ? startDate.toISOString() : '',
      endDate: startDate ? new Date(startDate.getTime() + 60 * 60 * 1000).toISOString() : '',
      clientReference: clientMatch?.[1]?.trim() || '',
      vehicleReference: vehicleMatch || '',
    }
    proposal.summary = startDate
      ? `Voy a agendar un turno para ${startDate.toLocaleString('es-AR')}.`
      : 'Puedo crear el turno, pero necesito fecha y hora.'
  } else if (normalized.includes('crear orden') || normalized.includes('nueva ot') || normalized.includes('orden de trabajo')) {
    const clientMatch = query.match(/(?:cliente|para)\s+([a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s]+)/)
    proposal.action = 'create_work_order'
    proposal.label = 'Crear orden de trabajo'
    proposal.payload = {
      clientReference: clientMatch?.[1]?.trim() || '',
      vehicleReference: parsePlate(query) || '',
      notes: query,
      priority: normalized.includes('urgente') ? 'urgent' : normalized.includes('alta') ? 'high' : 'normal',
    }
    proposal.summary = 'Puedo crear una orden de trabajo nueva con prioridad operativa.'
  } else if (normalized.includes('presupuesto') && (normalized.includes('crear') || normalized.includes('generar'))) {
    const clientMatch = query.match(/(?:cliente|para)\s+([a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s]+)/)
    proposal.action = 'create_quotation'
    proposal.label = 'Generar presupuesto'
    proposal.payload = {
      clientReference: clientMatch?.[1]?.trim() || '',
      vehicleReference: parsePlate(query) || '',
      notes: query,
    }
    proposal.summary = 'Puedo generar un presupuesto base en borrador para que lo revises antes de completarlo.'
  } else if ((normalized.includes('cambiar estado') || normalized.includes('actualizar estado')) && normalized.includes('orden')) {
    const workOrderNumber = query.match(/(?:ot|orden(?: de trabajo)?)[^\d]*(\d+)/i)?.[1]
    proposal.action = 'update_work_order_status'
    proposal.label = 'Actualizar estado de orden'
    proposal.payload = {
      workOrderNumber: workOrderNumber ? Number(workOrderNumber) : null,
      status: mapWorkOrderStatus(query),
      notes: query,
    }
    proposal.summary = workOrderNumber
      ? `Puedo actualizar la orden ${workOrderNumber} al estado ${proposal.payload.status}.`
      : 'Puedo cambiar el estado, pero necesito el número de la OT.'
  }

  if (proposal.action) {
    proposal.missingFields = buildMissingFields(proposal.action, proposal.payload)

    return {
      type: 'proposal',
      response:
        proposal.missingFields.length > 0
          ? `${proposal.summary} Todavía faltan estos datos: ${proposal.missingFields.join(', ')}.`
          : `${proposal.summary} Necesito tu confirmación para ejecutarlo.`,
      proposal,
      snapshot,
      tokensUsed: approxTokens(query) + approxTokens(JSON.stringify(proposal)),
    }
  }

  if (normalized.includes('inventario') || normalized.includes('stock')) {
    const lowStockItems = await getLowStockItems(tenantId, { take: 5 })

    const response =
      lowStockItems.length === 0
        ? `No detecto faltantes críticos. Hoy tenés ${snapshot.lowStockItems} ítems con stock sensible.`
        : `Hay ${snapshot.lowStockItems} ítems sensibles. Los más urgentes son: ${lowStockItems
            .map((item) => `${item.name} (${item.stock}/${item.minStock})`)
            .join(', ')}.`

    return {
      type: 'answer',
      response,
      snapshot,
      tokensUsed: approxTokens(query) + approxTokens(response),
    }
  }

  if (normalized.includes('caja') || normalized.includes('facturacion') || normalized.includes('facturación')) {
    const response = `Resumen rápido: clientes ${snapshot.clients}, vehículos ${snapshot.vehicles}, turnos programados ${snapshot.scheduledTurns}, OT abiertas ${snapshot.openWorkOrders}, presupuestos borrador ${snapshot.draftQuotations} y caja pendiente estimada ARS ${snapshot.pendingCash.toLocaleString('es-AR')}.`
    return {
      type: 'answer',
      response,
      snapshot,
      tokensUsed: approxTokens(query) + approxTokens(response),
    }
  }

  if (normalized.includes('buscar cliente')) {
    const term = quotedValue || extractAfterKeyword(query, ['buscar cliente'])
    const clients = await prisma.client.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })
    const response =
      clients.length === 0
        ? `No encontré clientes que coincidan con "${term}".`
        : `Encontré ${clients.length}: ${clients.map((client) => `${client.firstName} ${client.lastName}`).join(', ')}.`
    return {
      type: 'answer',
      response,
      snapshot,
      tokensUsed: approxTokens(query) + approxTokens(response),
    }
  }

  if (normalized.includes('buscar vehiculo') || normalized.includes('buscar vehículo')) {
    const reference = parsePlate(query) || quotedValue || extractAfterKeyword(query, ['buscar vehiculo', 'buscar vehículo'])
    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId,
        OR: [
          { plate: { contains: reference, mode: 'insensitive' } },
          { brand: { contains: reference, mode: 'insensitive' } },
          { model: { contains: reference, mode: 'insensitive' } },
        ],
      },
      include: { client: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })
    const response =
      vehicles.length === 0
        ? `No encontré vehículos que coincidan con "${reference}".`
        : `Encontré ${vehicles.length}: ${vehicles
            .map((vehicle) => `${vehicle.brand} ${vehicle.model}${vehicle.plate ? ` · ${vehicle.plate}` : ''} · ${vehicle.client.firstName} ${vehicle.client.lastName}`)
            .join(', ')}.`
    return {
      type: 'answer',
      response,
      snapshot,
      tokensUsed: approxTokens(query) + approxTokens(response),
    }
  }

  const response = `Puedo ayudarte con clientes, vehículos, turnos, presupuestos, órdenes, inventario y caja. Estado actual: ${snapshot.clients} clientes, ${snapshot.vehicles} vehículos, ${snapshot.scheduledTurns} turnos programados, ${snapshot.openWorkOrders} OT abiertas y ${snapshot.lowStockItems} alertas de stock. Si querés ejecutar algo, pedímelo en forma directa y te voy a pedir confirmación antes de hacerlo.`

  return {
    type: 'answer',
    response,
    snapshot,
    tokensUsed: approxTokens(query) + approxTokens(response),
  }
}

export async function executeCopilotProposal({ tenantId, proposal }) {
  if (!proposal?.action) {
    throw new Error('No hay una acción pendiente para ejecutar.')
  }

  const payload = proposal.payload || {}

  if (proposal.missingFields?.length) {
    throw new Error(`Faltan datos obligatorios: ${proposal.missingFields.join(', ')}.`)
  }

  if (proposal.action === 'create_client') {
    const name = splitFullName(payload.fullName)
    return prisma.client.create({
      data: {
        tenantId,
        firstName: name.firstName,
        lastName: name.lastName,
        status: 'active',
        notes: 'Creado desde Copilot IA',
      },
    })
  }

  if (proposal.action === 'create_vehicle') {
    const client = await findClientByReference(tenantId, payload.clientReference)
    if (!client) {
      throw new Error('No encontré el cliente indicado para asignarle el vehículo.')
    }

    return prisma.vehicle.create({
      data: {
        tenantId,
        clientId: client.id,
        brand: payload.brand,
        model: payload.model,
        plate: payload.plate || null,
        year: payload.year || null,
        notes: 'Registrado desde Copilot IA',
      },
      include: { client: true },
    })
  }

  if (proposal.action === 'create_turn') {
    let client = null
    let vehicle = null

    if (payload.clientReference) {
      client = await findClientByReference(tenantId, payload.clientReference)
    }

    if (payload.vehicleReference) {
      vehicle = await findVehicleByReference(tenantId, payload.vehicleReference)
    }

    return prisma.calendarEvent.create({
      data: {
        tenantId,
        title: payload.title,
        description: 'Agendado desde Copilot IA',
        type: 'appointment',
        status: 'scheduled',
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        clientId: client?.id || vehicle?.clientId || null,
        vehicleId: vehicle?.id || null,
      },
      include: { client: true, vehicle: true },
    })
  }

  if (proposal.action === 'create_work_order') {
    const client = await findClientByReference(tenantId, payload.clientReference)
    const vehicle = await findVehicleByReference(tenantId, payload.vehicleReference)

    if (!client || !vehicle) {
      throw new Error('Necesito un cliente y un vehículo válidos para crear la orden de trabajo.')
    }

    const number = await getNextTenantNumber('workOrder', tenantId)

    return prisma.workOrder.create({
      data: {
        tenantId,
        number,
        clientId: client.id,
        vehicleId: vehicle.id,
        priority: payload.priority || 'normal',
        status: 'pending',
        notes: payload.notes || 'Creada desde Copilot IA',
      },
      include: { client: true, vehicle: true },
    })
  }

  if (proposal.action === 'create_quotation') {
    const client = await findClientByReference(tenantId, payload.clientReference)
    const vehicle = await findVehicleByReference(tenantId, payload.vehicleReference)

    if (!client || !vehicle) {
      throw new Error('Necesito un cliente y un vehículo válidos para crear el presupuesto.')
    }

    const number = await getNextTenantNumber('quotation', tenantId)

    return prisma.quotation.create({
      data: {
        tenantId,
        number,
        clientId: client.id,
        vehicleId: vehicle.id,
        status: 'draft',
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        notes: payload.notes || 'Presupuesto generado desde Copilot IA',
      },
      include: { client: true, vehicle: true, items: true },
    })
  }

  if (proposal.action === 'update_work_order_status') {
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        tenantId,
        number: payload.workOrderNumber,
      },
      include: { client: true, vehicle: true },
    })

    if (!workOrder) {
      throw new Error('No encontré la orden de trabajo indicada.')
    }

    return prisma.workOrder.update({
      where: { id: workOrder.id },
      data: {
        status: payload.status,
        notes: payload.notes ? `${workOrder.notes || ''} | ${payload.notes}`.trim() : workOrder.notes,
      },
      include: { client: true, vehicle: true },
    })
  }

  throw new Error('La acción solicitada todavía no está soportada.')
}

export async function saveAIQueryLog({ tenantId, userId, query, response, type, tokensUsed }) {
  return prisma.aIQuery.create({
    data: {
      tenantId,
      userId: userId || null,
      query,
      response,
      type,
      tokensUsed: tokensUsed || approxTokens(query) + approxTokens(response),
    },
  })
}
