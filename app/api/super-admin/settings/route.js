import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { sanitizeString, sanitizeValue } from '../../../../lib/request-security'
import { requireSuperAdminContext } from '../../../../lib/super-admin-auth'

export const dynamic = 'force-dynamic'

// GET all global settings
export async function GET(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const settings = await prisma.globalSetting.findMany({ orderBy: { key: 'asc' } })
    return jsonResponse(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return errorResponse('No se pudo obtener la configuración global.')
  }
}

// POST (or PUT to set multiple settings, or individual PATCH, let's make POST to create/update
export async function POST(req) {
  try {
    const authResult = await requireSuperAdminContext(req)
    if (!authResult.ok) {
      return authResult.error
    }

    const { context } = authResult
    const protection = protectInternalMutation({
      req,
      scope: 'super-admin:settings:update',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const updates = sanitizeValue(await req.json())
    if (!Array.isArray(updates)) {
      return errorResponse('El payload de configuración debe ser una lista.', 400)
    }

    const results = []

    for (const { key, value, type, description } of updates) {
      if (!key) {
        continue
      }

      const existing = await prisma.globalSetting.findUnique({ where: { key } })
      if (existing) {
        const updated = await prisma.globalSetting.update({
          where: { key },
          data: {
            value: sanitizeString(value),
            type: sanitizeString(type) || existing.type,
            description: sanitizeString(description) || null,
          },
        })
        results.push(updated)
      } else {
        const created = await prisma.globalSetting.create({
          data: {
            key: sanitizeString(key),
            value: sanitizeString(value),
            type: sanitizeString(type) || 'string',
            description: sanitizeString(description) || null,
          },
        })
        results.push(created)
      }
    }

    return jsonResponse(results, 200, protection.headers)
  } catch (error) {
    console.error('Error updating settings:', error)
    return errorResponse('No se pudo actualizar la configuración global.')
  }
}
