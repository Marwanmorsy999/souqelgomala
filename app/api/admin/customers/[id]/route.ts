import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, notFound, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { getCustomerDetail } from '@/services/customers'

export const dynamic = 'force-dynamic'

/**
 * Admin customer detail endpoint.
 *
 * GET /api/admin/customers/:id — customer + order history (RBAC: customers.read).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'customers.read')) {
    return forbidden('ليس لديك صلاحية لعرض العملاء')
  }
  const { id } = await params
  try {
    const detail = await getCustomerDetail(id)
    if (!detail) return notFound('العميل غير موجود')
    return ok(detail)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل العميل')
  }
}