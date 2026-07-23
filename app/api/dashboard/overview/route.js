import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { requireTenantContext } from '../../../../lib/request-context'
import {
  buildWeeklySeries,
  decimalToNumber,
  getStartOfBusinessWeek,
} from '../../../../lib/dashboard-metrics'

export const dynamic = 'force-dynamic'

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
      appointmentsToday,
      appointmentsWeek,
      pendingQuotations,
      approvedQuotations,
      rejectedQuotations,
      activeWorkOrders,
      finishedWorkOrders,
      dailyBillingAggregate,
      weeklyInvoices,
      monthlyBillingAggregate,
      yearlyBillingAggregate,
      pendingCollectionsAggregate,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { tenantId, createdAt: { gte: startOfToday, lt: endOfToday } },
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
      prisma.invoice.aggregate({
        where: { tenantId, date: { gte: startOfToday }, status: 'paid' },
        _sum: { total: true },
      }),
      prisma.invoice.findMany({
        where: { tenantId, date: { gte: startOfWeek, lt: endOfWeek }, status: 'paid' },
        select: { total: true, date: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, date: { gte: startOfMonth }, status: 'paid' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, date: { gte: startOfYear }, status: 'paid' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: 'pending' },
        _sum: { total: true },
      }),
    ])

    return jsonResponse({
      general: {
        vehiclesToday,
        appointmentsToday,
        appointmentsWeek,
        pendingQuotations,
        approvedQuotations,
        rejectedQuotations,
        activeWorkOrders,
        finishedWorkOrders,
      },
      economic: {
        dailyBilling: decimalToNumber(dailyBillingAggregate._sum.total),
        weeklyBilling: weeklyInvoices.reduce((sum, invoice) => sum + decimalToNumber(invoice.total), 0),
        monthlyBilling: decimalToNumber(monthlyBillingAggregate._sum.total),
        yearlyBilling: decimalToNumber(yearlyBillingAggregate._sum.total),
        pendingCollections: decimalToNumber(pendingCollectionsAggregate._sum.total),
        weeklySeries: buildWeeklySeries(weeklyInvoices, startOfWeek),
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard overview:', error)
    return errorResponse('No se pudieron obtener las métricas principales del dashboard.')
  }
}
