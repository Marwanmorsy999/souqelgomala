import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { listCustomersAdmin } from '@/services/customers'

export const dynamic = 'force-dynamic'

/**
 * Admin customers endpoint.
 *
 * GET /api/admin/customers?search=... — list customers (RBAC: customers.read).
 * Supports optional search by name / phone / email.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'customers.read')) {
    return forbidden('ليس لديك صلاحية لعرض العملاء')
  }
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? '100')
    const rows = await listCustomersAdmin({ search, limit })
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل العملاء')
  }
}