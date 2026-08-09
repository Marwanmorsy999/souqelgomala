import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { listAllReviews } from '@/services/reviews'

export const dynamic = 'force-dynamic'

/** GET /api/admin/reviews — all reviews (RBAC: reviews.read). */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'reviews.read')) {
    return forbidden('ليس لديك صلاحية لعرض التقييمات')
  }
  try {
    const rows = await listAllReviews()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل التقييمات')
  }
}
