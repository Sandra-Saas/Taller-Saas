import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'

// GET /api/super-admin/companies
export async function GET(req) {
  try {
    // TODO: Implement super admin authentication check

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
    return errorResponse('Failed to fetch companies')
  }
}

// POST /api/super-admin/companies - Create a new company
export async function POST(req) {
  try {
    // TODO: Implement super admin authentication check
    const data = await req.json()
    const { businessName, commercialName, cuit, email, planId } = data

    // Validate required fields
    if (!businessName || !commercialName || !cuit || !email || !planId) {
      return errorResponse('Missing required fields', 400)
    }

    // Create company (tenant)
    const company = await prisma.tenant.create({
      data: {
        businessName,
        commercialName,
        cuit,
        email,
        planId,
        status: 'active', // Default status
        ivaCondition: 'Responsable Inscripto', // Default
        country: 'Argentina' // Default
      },
      include: {
        plan: true
      }
    })

    return jsonResponse(company, 201)
  } catch (error) {
    console.error('Error creating company:', error)
    if (error.code === 'P2002') {
      return errorResponse('CUIT already exists', 400)
    }
    return errorResponse('Failed to create company')
  }
}
