import prisma from '../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../lib/api'
import { requireTenantContext } from '../../../lib/request-context'

export const dynamic = 'force-dynamic'

function decimalToNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value.toNumber === 'function') {
    return value.toNumber()
  }

  return Number(value || 0)
}

function getStartOfBusinessWeek(date) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return start
}

function buildWeeklySeries(invoices, startOfWeek) {
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

function classifyVehicleStage(vehicle) {
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

  if (['repairing', 'testing', 'washing'].includes(latestStatus) || ['pending', 'in_progress'].includes(latestWorkOrderStatus || '')) {
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

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const tenantId = context.tenantId

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)
    const startOfWeek = getStartOfBusinessWeek(startOfToday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    const [
      vehiclesToday,
      vehiclesForStatus,
      appointmentsToday,
      appointmentsWeek,
      pendingQuotations,
      approvedQuotations,
      rejectedQuotations,
      activeWorkOrders,
      finishedWorkOrders,
      dailyInvoices,
      weeklyInvoices,
      monthlyInvoices,
      yearlyInvoices,
      pendingInvoices,
      lowStockItems,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { tenantId, createdAt: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.vehicle.findMany({
        where: { tenantId },
        select: {
          id: true,
          createdAt: true,
          receptions: {
            select: { id: true },
            take: 1,
          },
          workOrders: {
            select: { id: true, status: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          quotations: {
            select: { id: true, status: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          statusLogs: {
            select: { status: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.calendarEvent.count({
        where: { tenantId, startDate: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.calendarEvent.count({
        where: { tenantId, startDate: { gte: startOfWeek, lt: endOfWeek } },
      }),
      prisma.quotation.count({
        where: { tenantId, status: 'draft' },
      }),
      prisma.quotation.count({
        where: { tenantId, status: 'approved' },
      }),
      prisma.quotation.count({
        where: { tenantId, status: 'rejected' },
      }),
      prisma.workOrder.count({
        where: { tenantId, status: { in: ['pending', 'in_progress'] } },
      }),
      prisma.workOrder.count({
        where: { tenantId, status: 'completed' },
      }),
      prisma.invoice.findMany({
        where: { tenantId, date: { gte: startOfToday }, status: 'paid' },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { tenantId, date: { gte: startOfWeek, lt: endOfWeek }, status: 'paid' },
        select: { total: true, date: true },
      }),
      prisma.invoice.findMany({
        where: { tenantId, date: { gte: startOfMonth }, status: 'paid' },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { tenantId, date: { gte: startOfYear }, status: 'paid' },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { tenantId, status: 'pending' },
        select: { total: true },
      }),
      prisma.inventoryItem.findMany({
        where: {
          tenantId,
          minStock: { gt: 0 },
        },
        select: { stock: true, minStock: true },
      }),
    ])

    const dailyBilling = dailyInvoices.reduce((sum, inv) => sum + decimalToNumber(inv.total), 0)
    const weeklyBilling = weeklyInvoices.reduce((sum, inv) => sum + decimalToNumber(inv.total), 0)
    const monthlyBilling = monthlyInvoices.reduce((sum, inv) => sum + decimalToNumber(inv.total), 0)
    const yearlyBilling = yearlyInvoices.reduce((sum, inv) => sum + decimalToNumber(inv.total), 0)
    const pendingCollections = pendingInvoices.reduce((sum, inv) => sum + decimalToNumber(inv.total), 0)
    const lowStockCount = lowStockItems.filter((item) => item.stock <= item.minStock).length
    const weeklySeries = buildWeeklySeries(weeklyInvoices, startOfWeek)
    const vehicleStatusSummary = vehiclesForStatus.reduce(
      (acc, vehicle) => {
        const stage = classifyVehicleStage(vehicle)

        if (stage === 'delivered') {
          acc.vehiclesDelivered += 1
          return acc
        }

        if (stage === 'ready_delivery') {
          acc.vehiclesFinished += 1
          return acc
        }

        if (['in_repair', 'diagnosis', 'waiting_parts'].includes(stage)) {
          acc.vehiclesInRepair += 1
          return acc
        }

        if (['waiting_reception', 'received_pending_definition', 'waiting_approval'].includes(stage)) {
          acc.vehiclesPending += 1
        }

        return acc
      },
      {
        vehiclesInRepair: 0,
        vehiclesFinished: 0,
        vehiclesDelivered: 0,
        vehiclesPending: 0,
      }
    )
    const vehiclePipeline = vehiclesForStatus.reduce(
      (acc, vehicle) => {
        const stage = classifyVehicleStage(vehicle)
        acc[stage] += 1
        return acc
      },
      {
        waiting_reception: 0,
        received_pending_definition: 0,
        diagnosis: 0,
        waiting_approval: 0,
        waiting_parts: 0,
        in_repair: 0,
        ready_delivery: 0,
        delivered: 0,
      }
    )

    return jsonResponse({
      general: {
        vehiclesToday,
        vehiclesInRepair: vehicleStatusSummary.vehiclesInRepair,
        vehiclesFinished: vehicleStatusSummary.vehiclesFinished,
        vehiclesDelivered: vehicleStatusSummary.vehiclesDelivered,
        vehiclesPending: vehicleStatusSummary.vehiclesPending,
        appointmentsToday,
        appointmentsWeek,
        pendingQuotations,
        approvedQuotations,
        rejectedQuotations,
        activeWorkOrders,
        finishedWorkOrders,
      },
      operations: {
        vehiclePipeline,
      },
      economic: {
        dailyBilling,
        weeklyBilling,
        monthlyBilling,
        yearlyBilling,
        pendingCollections,
        weeklySeries,
      },
      commercial: {},
      inventory: {
        lowStockItems: lowStockCount,
      },
      mechanics: {},
      branches: {},
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return errorResponse('No se pudieron obtener las métricas del dashboard.')
  }
}
