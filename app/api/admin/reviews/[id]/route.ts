import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { moderateReview, deleteReview } from '@/services/reviews'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/reviews/:id — approve | reject (RBAC: reviews.write). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'reviews.write')) {
    return forbidden('ليس لديك صلاحية لإدارة التقييمات')
  }
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const b = body as Record<string, unknown>
  const action = b.action
  if (action !== 'approve' && action !== 'reject') {
    return validationError({ action: ['action must be approve or reject'] })
  }
  try {
    const result = await moderateReview(auth.user, id, action, b.reason as string | undefined)
    return ok(result)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'تعذر تحديث التقييم' },
      { status: 400 },
    )
  }
}

/** DELETE /api/admin/reviews/:id — soft delete (RBAC: reviews.write). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'reviews.write')) {
    return forbidden('ليس لديك صلاحية لإدارة التقييمات')
  }
  const { id } = await params
  try {
    const result = await deleteReview(auth.user, id)
    return ok(result)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'تعذر حذف التقييم' },
      { status: 400 },
    )
  }
}
