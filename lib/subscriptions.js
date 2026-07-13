import prisma from './prisma'

// Create a trial subscription for a tenant
export async function createTrialSubscription(tenantId, planId, trialDays = 14) {
  const startDate = new Date()
  const trialEndDate = new Date(startDate)
  trialEndDate.setDate(trialEndDate.getDate() + trialDays)

  return await prisma.subscription.create({
    data: {
      tenantId,
      planId,
      status: 'trial',
      startDate,
      trialEndDate,
      autoRenew: true,
    },
  })
}

// Check and suspend expired subscriptions
export async function checkExpiredSubscriptions() {
  const now = new Date()

  // Find expired trial subscriptions
  const expiredTrials = await prisma.subscription.findMany({
    where: {
      status: 'trial',
      trialEndDate: { lt: now },
    },
  })

  // Suspend expired trials
  for (const sub of expiredTrials) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'suspended' },
    })
    await prisma.tenant.update({
      where: { id: sub.tenantId },
      data: { status: 'suspended' },
    })
  }

  // Find expired paid subscriptions
  const expiredPaid = await prisma.subscription.findMany({
    where: {
      status: 'active',
      nextPaymentDate: { lt: now },
    },
  })

  for (const sub of expiredPaid) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'suspended' },
    })
    await prisma.tenant.update({
      where: { id: sub.tenantId },
      data: { status: 'suspended' },
    })
  }

  return { suspendedTrials: expiredTrials.length, suspendedPaid: expiredPaid.length }
}

// Check user limit
export async function checkUserLimit(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  })

  if (!tenant) return { canAddUser: false, currentUsers: 0, limit: 0 }

  const currentUsers = await prisma.user.count({ where: { tenantId } })
  const limit = tenant.plan.maxUsers

  return {
    canAddUser: currentUsers < limit,
    currentUsers,
    limit,
  }
}
