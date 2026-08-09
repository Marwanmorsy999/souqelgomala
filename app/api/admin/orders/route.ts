import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, serverError } from '@/services/api-response'
import { listOrders } from '@/services/orders'

export const dynamic = 'force-dynamic'

/** GET /api/admin/orders — list orders (RBAC: orders.read). */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'orders.read')) {
    return forbidden('ليس لديك صلاحية لعرض الطلبات')
  }
  try {
    const rows = await listOrders()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل الطلبات')
  }
}
