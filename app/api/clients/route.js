import prisma from '../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../lib/api'
import { createAuditLog } from '../../../lib/audit'
import { requireTenantContext } from '../../../lib/request-context'
import { readSanitizedJson, sanitizeString } from '../../../lib/request-security'

export const dynamic = 'force-dynamic'

const clientInclude = {
  phones: true,
  emails: true,
  addresses: true,
  company: true,
  tags: { include: { tag: true } },
}

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const clients = await prisma.client.findMany({
      where: { tenantId: context.tenantId },
      include: clientInclude,
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return errorResponse('No se pudieron obtener los clientes.')
  }
}

export async function POST(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const data = await readSanitizedJson(req)
    const firstName = sanitizeString(data.firstName)
    const lastName = sanitizeString(data.lastName)

    if (!firstName || !lastName) {
      return errorResponse('Nombre y apellido son obligatorios para crear el cliente.', 400)
    }

    let companyId = null
    if (data.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: data.companyId,
          tenantId: context.tenantId,
        },
      })

      if (!company) {
        return errorResponse('La empresa asociada no pertenece al tenant actual.', 400)
      }

      companyId = company.id
    }

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        status: sanitizeString(data.status) || 'active',
        notes: sanitizeString(data.notes) || null,
        birthday: data.birthday ? new Date(data.birthday) : null,
        companyId,
        tenantId: context.tenantId,
      },
      include: clientInclude,
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'client.created',
      entity: 'Client',
      entityId: client.id,
      newData: {
        firstName: client.firstName,
        lastName: client.lastName,
        companyId: client.companyId,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(client, 201)
  } catch (error) {
    console.error('Error creating client:', error)
    return errorResponse('No se pudo crear el cliente.')
  }
}
