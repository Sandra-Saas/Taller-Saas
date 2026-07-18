import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { requireTenantContext } from '../../../../lib/request-context'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'

export const dynamic = 'force-dynamic'

const clientInclude = {
  phones: true,
  emails: true,
  addresses: true,
  company: true,
  tags: { include: { tag: true } },
  vehicles: true,
  workOrders: true,
}

async function findClientById(id, tenantId) {
  return prisma.client.findFirst({
    where: { id, tenantId },
    include: clientInclude,
  })
}

export async function GET(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const client = await findClientById(params.id, context.tenantId)

    if (!client) {
      return errorResponse('No encontré el cliente solicitado.', 404)
    }

    return jsonResponse(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return errorResponse('No se pudo obtener el cliente.')
  }
}

export async function PUT(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const existingClient = await prisma.client.findFirst({
      where: { id: params.id, tenantId: context.tenantId },
    })

    if (!existingClient) {
      return errorResponse('No encontré el cliente solicitado.', 404)
    }

    const data = await readSanitizedJson(req)
    let companyId = existingClient.companyId

    if (Object.prototype.hasOwnProperty.call(data, 'companyId')) {
      if (!data.companyId) {
        companyId = null
      } else {
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
    }

    const client = await prisma.client.update({
      where: { id: existingClient.id },
      data: {
        firstName: Object.prototype.hasOwnProperty.call(data, 'firstName')
          ? sanitizeString(data.firstName) || existingClient.firstName
          : undefined,
        lastName: Object.prototype.hasOwnProperty.call(data, 'lastName')
          ? sanitizeString(data.lastName) || existingClient.lastName
          : undefined,
        status: Object.prototype.hasOwnProperty.call(data, 'status')
          ? sanitizeString(data.status) || existingClient.status
          : undefined,
        notes: Object.prototype.hasOwnProperty.call(data, 'notes')
          ? sanitizeString(data.notes) || null
          : undefined,
        birthday: Object.prototype.hasOwnProperty.call(data, 'birthday')
          ? data.birthday
            ? new Date(data.birthday)
            : null
          : undefined,
        companyId,
      },
      include: clientInclude,
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'client.updated',
      entity: 'Client',
      entityId: client.id,
      oldData: existingClient,
      newData: {
        firstName: client.firstName,
        lastName: client.lastName,
        status: client.status,
        companyId: client.companyId,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return errorResponse('No se pudo actualizar el cliente.')
  }
}

export async function DELETE(req, { params }) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const existingClient = await prisma.client.findFirst({
      where: { id: params.id, tenantId: context.tenantId },
    })

    if (!existingClient) {
      return errorResponse('No encontré el cliente solicitado.', 404)
    }

    await prisma.client.delete({
      where: { id: existingClient.id },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'client.deleted',
      entity: 'Client',
      entityId: existingClient.id,
      oldData: existingClient,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    return jsonResponse({ message: 'Cliente eliminado correctamente.' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return errorResponse('No se pudo eliminar el cliente.')
  }
}
