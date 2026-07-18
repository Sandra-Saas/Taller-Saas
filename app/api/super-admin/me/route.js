import { jsonResponse } from '@/lib/api'
import { requireSuperAdminContext } from '@/lib/super-admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  const authResult = await requireSuperAdminContext(req)
  if (!authResult.ok) {
    return authResult.error
  }

  const { context } = authResult

  return jsonResponse({
    superAdmin: {
      id: context.superAdmin.id,
      firstName: context.superAdmin.firstName,
      lastName: context.superAdmin.lastName,
      email: context.superAdmin.email,
      status: context.superAdmin.status,
    },
    session: {
      email: context.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
  })
}
