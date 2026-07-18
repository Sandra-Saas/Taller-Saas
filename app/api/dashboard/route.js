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
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    const [
      vehiclesToday,
      vehiclesInRepair,
      vehiclesFinished,
      vehiclesDelivered,
      vehiclesPending,
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
      prisma.vehicle.count({
        where: {
          tenantId,
          statusLogs: { some: { status: { in: ['repairing', 'diagnosis', 'waiting_parts'] } } },
        },
      }),
      prisma.vehicle.count({
        where: {
          tenantId,
          statusLogs: { some: { status: 'finished' } },
        },
      }),
      prisma.vehicle.count({
        where: {
          tenantId,
          statusLogs: { some: { status: 'delivered' } },
        },
      }),
      prisma.vehicle.count({
        where: {
          tenantId,
          statusLogs: { some: { status: { in: ['waiting', 'received'] } } },
        },
      }),
      prisma.calendarEvent.count({
        where: { tenantId, startDate: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.calendarEvent.count({
        where: { tenantId, startDate: { gte: startOfWeek } },
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
        where: { tenantId, date: { gte: startOfWeek }, status: 'paid' },
        select: { total: true },
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

    const netProfit = monthlyBilling * 0.3
    const operatingExpenses = monthlyBilling * 0.4
    const dailyCash = dailyBilling
    const monthlyBalance = netProfit - operatingExpenses
    const yearlyBalance = yearlyBilling * 0.3 - yearlyBilling * 0.4
    const cashFlow = dailyBilling - operatingExpenses / 30

    return jsonResponse({
      general: {
        vehiclesToday,
        vehiclesInRepair,
        vehiclesFinished,
        vehiclesDelivered,
        vehiclesPending,
        appointmentsToday,
        appointmentsWeek,
        pendingQuotations,
        approvedQuotations,
        rejectedQuotations,
        activeWorkOrders,
        finishedWorkOrders,
      },
      economic: {
        dailyBilling,
        weeklyBilling,
        monthlyBilling,
        yearlyBilling,
        netProfit,
        operatingExpenses,
        pendingCollections,
        dailyCash,
        monthlyBalance,
        yearlyBalance,
        cashFlow,
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
