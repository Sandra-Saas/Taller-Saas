import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'
import { requireSuperAdminContext } from '../../../../lib/super-admin-auth'

export const dynamic = 'force-dynamic'

// GET /api/super-admin/companies
export async function GET(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const companies = await prisma.tenant.findMany({
      include: {
        plan: true,
        subscription: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return jsonResponse(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return errorResponse('No se pudieron obtener las empresas.')
  }
}

// POST /api/super-admin/companies - Create a new company
export async function POST(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { context } = authResult
    const protection = protectInternalMutation({
      req,
      scope: 'super-admin:companies:create',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const data = await readSanitizedJson(req)
    const { businessName, commercialName, cuit, email, planId } = data

    // Validate required fields
    if (!businessName || !commercialName || !cuit || !email || !planId) {
      return errorResponse('Faltan campos obligatorios.', 400)
    }

    // Create company (tenant)
    const company = await prisma.tenant.create({
      data: {
        businessName: sanitizeString(businessName),
        commercialName: sanitizeString(commercialName),
        cuit: sanitizeString(cuit),
        email: sanitizeString(email),
        planId,
        status: 'active', // Default status
        ivaCondition: 'Responsable Inscripto', // Default
        country: 'Argentina' // Default
      },
      include: {
        plan: true
      }
    })

    await createAuditLog({
      tenantId: company.id,
      userId: null,
      action: 'super_admin.company.created',
      entity: 'Tenant',
      entityId: company.id,
      newData: {
        businessName: company.businessName,
        commercialName: company.commercialName,
        cuit: company.cuit,
        createdBySuperAdminId: context.superAdmin.id,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(company, 201, protection.headers)
  } catch (error) {
    console.error('Error creating company:', error)
    if (error.code === 'P2002') {
      return errorResponse('El CUIT ya existe.', 400)
    }
    return errorResponse('No se pudo crear la empresa.')
  }
}
