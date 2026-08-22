import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { getDeliverySummary } from '@/services/delivery-service'

export const dynamic = 'force-dynamic'

/** GET /api/admin/delivery/summary — hub overview metrics (RBAC: delivery.read). */
export async function GET(_request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'delivery.read')) {
    return forbidden('ليس لديك صلاحية لعرض التوصيل')
  }
  try {
    const summary = await getDeliverySummary()
    return ok(summary)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل ملخص التوصيل')
  }
}
