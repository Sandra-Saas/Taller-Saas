import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'

// GET all global settings
export async function GET() {
  try {
    const settings = await prisma.globalSetting.findMany({ orderBy: { key: 'asc' })
    return jsonResponse(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return errorResponse('Failed to fetch settings')
  }
}

// POST (or PUT to set multiple settings, or individual PATCH, let's make POST to create/update
export async function POST(req) {
  try {
    const updates = await req.json()
    const results = []

    for (const { key, value, type, description } of updates) {
      const existing = await prisma.globalSetting.findUnique({ where: { key } })
      if (existing) {
        const updated = await prisma.globalSetting.update({
          where: { key },
          data: { value, type, description },
        })
        results.push(updated)
      } else {
        const created = await prisma.globalSetting.create({
          data: { key, value, type, type: type || 'string', description },
        })
        results.push(created)
      }
    }

    return jsonResponse(results)
  } catch (error) {
    console.error('Error updating settings:', error)
    return errorResponse('Failed to update settings')
  }
}
