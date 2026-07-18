import prisma from './prisma'
import { errorResponse } from './api'
import { getRequestContext } from './request-context'

export async function requireSuperAdminContext(req) {
  const context = await getRequestContext(req, { allowApiKey: false })

  if (!context?.email) {
    return {
      ok: false,
      error: errorResponse('No hay una sesión válida de super administrador.', 401),
    }
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: context.email },
  })

  if (!superAdmin || superAdmin.status !== 'active') {
    return {
      ok: false,
      error: errorResponse('No tenés permisos de super administrador para esta operación.', 403),
    }
  }

  return {
    ok: true,
    context: {
      ...context,
      superAdmin,
    },
  }
}
