export function decimalToNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value.toNumber === 'function') {
    return value.toNumber()
  }

  return Number(value || 0)
}

export function getStartOfBusinessWeek(date) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return start
}

export function buildWeeklySeries(invoices, startOfWeek) {
  const formatter = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index)

    return {
      key: date.toISOString().slice(0, 10),
      label: formatter.format(date).replace('.', ''),
      value: 0,
    }
  })

  const indexByDate = new Map(days.map((day, index) => [day.key, index]))

  for (const invoice of invoices) {
    const invoiceDate = new Date(invoice.date)
    const key = invoiceDate.toISOString().slice(0, 10)
    const targetIndex = indexByDate.get(key)

    if (targetIndex !== undefined) {
      days[targetIndex].value += decimalToNumber(invoice.total)
    }
  }

  return days
}

export function classifyVehicleStage(vehicle) {
  const latestStatus = vehicle.statusLogs[0]?.status || null
  const latestWorkOrderStatus = vehicle.workOrders[0]?.status || null
  const latestQuotationStatus = vehicle.quotations[0]?.status || null
  const hasReception = vehicle.receptions.length > 0

  if (latestStatus === 'delivered') {
    return 'delivered'
  }

  if (latestStatus === 'finished' || latestWorkOrderStatus === 'completed') {
    return 'ready_delivery'
  }

  if (latestStatus === 'waiting_parts') {
    return 'waiting_parts'
  }

  if (latestStatus === 'pending_approval') {
    return 'waiting_approval'
  }

  if (latestStatus === 'diagnosis' || latestStatus === 'quotation') {
    return 'diagnosis'
  }

  if (
    ['repairing', 'testing', 'washing'].includes(latestStatus) ||
    ['pending', 'in_progress'].includes(latestWorkOrderStatus || '')
  ) {
    return 'in_repair'
  }

  if (!hasReception || latestStatus === 'waiting') {
    return 'waiting_reception'
  }

  if (latestStatus === 'received') {
    return 'received_pending_definition'
  }

  if (['draft', 'sent', 'approved'].includes(latestQuotationStatus || '')) {
    return 'waiting_approval'
  }

  return 'received_pending_definition'
}

export function createEmptyVehicleStatusSummary() {
  return {
    vehiclesInRepair: 0,
    vehiclesFinished: 0,
    vehiclesDelivered: 0,
    vehiclesPending: 0,
  }
}

export function createEmptyVehiclePipeline() {
  return {
    waiting_reception: 0,
    received_pending_definition: 0,
    diagnosis: 0,
    waiting_approval: 0,
    waiting_parts: 0,
    in_repair: 0,
    ready_delivery: 0,
    delivered: 0,
  }
}

export function summarizeVehicleOperations(vehicles) {
  const vehicleStatusSummary = createEmptyVehicleStatusSummary()
  const vehiclePipeline = createEmptyVehiclePipeline()

  for (const vehicle of vehicles) {
    const stage = classifyVehicleStage(vehicle)
    vehiclePipeline[stage] += 1

    if (stage === 'delivered') {
      vehicleStatusSummary.vehiclesDelivered += 1
      continue
    }

    if (stage === 'ready_delivery') {
      vehicleStatusSummary.vehiclesFinished += 1
      continue
    }

    if (['in_repair', 'diagnosis', 'waiting_parts'].includes(stage)) {
      vehicleStatusSummary.vehiclesInRepair += 1
      continue
    }

    if (['waiting_reception', 'received_pending_definition', 'waiting_approval'].includes(stage)) {
      vehicleStatusSummary.vehiclesPending += 1
    }
  }

  return {
    vehicleStatusSummary,
    vehiclePipeline,
  }
}
