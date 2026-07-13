import prisma from '../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../lib/api';

// GET /api/dashboard
export async function GET(req) {
  try {
    // TODO: Get tenantId from auth
    const tenantId = 'test-tenant-id'; // Placeholder

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // General Stats
    const vehiclesToday = await prisma.vehicle.count({
      where: { tenantId, createdAt: { gte: startOfToday } }
    });
    const vehiclesInRepair = await prisma.vehicle.count({
      where: {
        tenantId,
        statusLogs: { some: { status: { in: ['repairing', 'diagnosis', 'waiting_parts'] } } }
      }
    });
    const vehiclesFinished = await prisma.vehicle.count({
      where: {
        tenantId,
        statusLogs: { some: { status: 'finished' } }
      }
    });
    const vehiclesDelivered = await prisma.vehicle.count({
      where: {
        tenantId,
        statusLogs: { some: { status: 'delivered' } }
      }
    });
    const vehiclesPending = await prisma.vehicle.count({
      where: {
        tenantId,
        statusLogs: { some: { status: { in: ['waiting', 'received'] } } }
      }
    });
    const appointmentsToday = await prisma.calendarEvent.count({
      where: { tenantId, startDate: { gte: startOfToday, lte: today } }
    });
    const appointmentsWeek = await prisma.calendarEvent.count({
      where: { tenantId, startDate: { gte: startOfWeek } }
    });

    const pendingQuotations = await prisma.quotation.count({
      where: { tenantId, status: 'draft' }
    });
    const approvedQuotations = await prisma.quotation.count({
      where: { tenantId, status: 'approved' }
    });
    const rejectedQuotations = await prisma.quotation.count({
      where: { tenantId, status: 'rejected' }
    });
    const activeWorkOrders = await prisma.workOrder.count({
      where: { tenantId, status: { in: ['pending', 'in_progress'] } }
    });
    const finishedWorkOrders = await prisma.workOrder.count({
      where: { tenantId, status: 'completed' }
    });

    // Economic Stats
    const dailyInvoices = await prisma.invoice.findMany({
      where: { tenantId, date: { gte: startOfToday }, status: 'paid' }
    });
    const dailyBilling = dailyInvoices.reduce((sum, inv) => sum + inv.total.toNumber(), 0);

    const weeklyInvoices = await prisma.invoice.findMany({
      where: { tenantId, date: { gte: startOfWeek }, status: 'paid' }
    });
    const weeklyBilling = weeklyInvoices.reduce((sum, inv) => sum + inv.total.toNumber(), 0);

    const monthlyInvoices = await prisma.invoice.findMany({
      where: { tenantId, date: { gte: startOfMonth }, status: 'paid' }
    });
    const monthlyBilling = monthlyInvoices.reduce((sum, inv) => sum + inv.total.toNumber(), 0);

    const yearlyInvoices = await prisma.invoice.findMany({
      where: { tenantId, date: { gte: startOfYear }, status: 'paid' }
    });
    const yearlyBilling = yearlyInvoices.reduce((sum, inv) => sum + inv.total.toNumber(), 0);

    // TODO: Calculate net profit, expenses, cash daily, etc.
    // For now, use placeholders
    const netProfit = monthlyBilling * 0.3;
    const operatingExpenses = monthlyBilling * 0.4;
    const pendingCollections = 0;
    const dailyCash = dailyBilling;
    const monthlyBalance = netProfit - operatingExpenses;
    const yearlyBalance = yearlyBilling * 0.3 - yearlyBilling * 0.4;
    const cashFlow = dailyBilling - operatingExpenses / 30;

    const generalStats = {
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
      finishedWorkOrders
    };
    const economicStats = {
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
      cashFlow
    };

    return jsonResponse({
      general: generalStats,
      economic: economicStats,
      commercial: {}, // TODO
      inventory: {}, // TODO
      mechanics: {}, // TODO
      branches: {} // TODO
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return errorResponse('Failed to fetch dashboard stats');
  }
}
