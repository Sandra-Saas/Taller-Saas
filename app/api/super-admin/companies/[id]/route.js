import prisma from '../../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../../lib/api'
import { createAuditLog } from '../../../../../lib/audit'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../../lib/internal-security'
import { readSanitizedJson, sanitizeString } from '../../../../../lib/request-security'
import { requireSuperAdminContext } from '../../../../../lib/super-admin-auth'

export const dynamic = 'force-dynamic'

// GET /api/super-admin/companies/:id
export async function GET(req, { params }) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { id } = params
    const company = await prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
        subscription: true,
        users: true,
        _count: {
          select: {
            users: true,
            clients: true,
            vehicles: true
          }
        }
      }
    })

    if (!company) {
      return errorResponse('No encontré la empresa solicitada.', 404)
    }

    return jsonResponse(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return errorResponse('No se pudo obtener la empresa.')
  }
}

// PUT /api/super-admin/companies/:id - Update company
export async function PUT(req, { params }) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { context } = authResult
    const protection = protectInternalMutation({
      req,
      scope: 'super-admin:companies:update',
      actorKey: getActorKeyFromContext(context),
      max: 20,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const { id } = params
    const data = await readSanitizedJson(req)
    const { businessName, commercialName, cuit, email, planId, status } = data
    const existingCompany = await prisma.tenant.findUnique({ where: { id } })

    if (!existingCompany) {
      return errorResponse('No encontré la empresa solicitada.', 404)
    }

    const company = await prisma.tenant.update({
      where: { id },
      data: {
        ...(businessName && { businessName: sanitizeString(businessName) }),
        ...(commercialName && { commercialName: sanitizeString(commercialName) }),
        ...(cuit && { cuit: sanitizeString(cuit) }),
        ...(email && { email: sanitizeString(email) }),
        ...(planId && { planId }),
        ...(status && { status: sanitizeString(status) })
      },
      include: { plan: true }
    })

    await createAuditLog({
      tenantId: company.id,
      userId: null,
      action: 'super_admin.company.updated',
      entity: 'Tenant',
      entityId: company.id,
      oldData: {
        businessName: existingCompany.businessName,
        commercialName: existingCompany.commercialName,
        cuit: existingCompany.cuit,
        status: existingCompany.status,
      },
      newData: {
        businessName: company.businessName,
        commercialName: company.commercialName,
        cuit: company.cuit,
        status: company.status,
        updatedBySuperAdminId: context.superAdmin.id,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(company, 200, protection.headers)
  } catch (error) {
    console.error('Error updating company:', error)
    if (error.code === 'P2025') {
      return errorResponse('No encontré la empresa solicitada.', 404)
    }
    return errorResponse('No se pudo actualizar la empresa.')
  }
}

// DELETE /api/super-admin/companies/:id - Delete company (soft delete)
export async function DELETE(req, { params }) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { context } = authResult
    const protection = protectInternalMutation({
      req,
      scope: 'super-admin:companies:delete',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const { id } = params
    const existingCompany = await prisma.tenant.findUnique({ where: { id } })

    if (!existingCompany) {
      return errorResponse('No encontré la empresa solicitada.', 404)
    }

    // Soft delete - mark as cancelled
    const company = await prisma.tenant.update({
      where: { id },
      data: { status: 'cancelled' }
    })

    await createAuditLog({
      tenantId: company.id,
      userId: null,
      action: 'super_admin.company.cancelled',
      entity: 'Tenant',
      entityId: company.id,
      oldData: {
        status: existingCompany.status,
      },
      newData: {
        status: company.status,
        updatedBySuperAdminId: context.superAdmin.id,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse({ message: 'Empresa cancelada correctamente.', company }, 200, protection.headers)
  } catch (error) {
    console.error('Error cancelling company:', error)
    if (error.code === 'P2025') {
      return errorResponse('No encontré la empresa solicitada.', 404)
    }
    return errorResponse('No se pudo cancelar la empresa.')
  }
}
