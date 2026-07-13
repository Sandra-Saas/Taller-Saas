import prisma from '../../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../../lib/api'

// GET /api/super-admin/companies/:id
export async function GET(req, { params }) {
  try {
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
      return errorResponse('Company not found', 404)
    }

    return jsonResponse(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return errorResponse('Failed to fetch company')
  }
}

// PUT /api/super-admin/companies/:id - Update company
export async function PUT(req, { params }) {
  try {
    const { id } = params
    const data = await req.json()
    const { businessName, commercialName, cuit, email, planId, status } = data

    const company = await prisma.tenant.update({
      where: { id },
      data: {
        ...(businessName && { businessName }),
        ...(commercialName && { commercialName }),
        ...(cuit && { cuit }),
        ...(email && { email }),
        ...(planId && { planId }),
        ...(status && { status })
      },
      include: { plan: true }
    })

    return jsonResponse(company)
  } catch (error) {
    console.error('Error updating company:', error)
    if (error.code === 'P2025') {
      return errorResponse('Company not found', 404)
    }
    return errorResponse('Failed to update company')
  }
}

// DELETE /api/super-admin/companies/:id - Delete company (soft delete)
export async function DELETE(req, { params }) {
  try {
    const { id } = params

    // Soft delete - mark as cancelled
    const company = await prisma.tenant.update({
      where: { id },
      data: { status: 'cancelled' }
    })

    return jsonResponse({ message: 'Company cancelled successfully', company })
  } catch (error) {
    console.error('Error cancelling company:', error)
    if (error.code === 'P2025') {
      return errorResponse('Company not found', 404)
    }
    return errorResponse('Failed to cancel company')
  }
}
