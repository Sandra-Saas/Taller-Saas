import prisma from './prisma'

export async function createAuditLog(input) {
  const {
    tenantId,
    userId = null,
    action,
    entity,
    entityId = null,
    oldData = null,
    newData = null,
    ipAddress = null,
    userAgent = null,
  } = input || {}

  if (!tenantId || !action || !entity) {
    return null
  }

  try {
    return await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entity,
        entityId,
        oldData,
        newData,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Error registrando auditoría:', error)
    return null
  }
}
