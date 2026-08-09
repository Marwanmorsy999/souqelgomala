import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { getOrderDetail, updateOrderStatus } from '@/services/orders'

export const dynamic = 'force-dynamic'

/** GET /api/admin/orders/:id — order detail (RBAC: orders.read). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'orders.read')) {
    return forbidden('ليس لديك صلاحية لعرض الطلبات')
  }
  const { id } = await params
  try {
    const detail = await getOrderDetail(id)
    if (!detail) return validationError({ id: ['الطلب غير موجود'] })
    return ok(detail)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل الطلب')
  }
}

/** PATCH /api/admin/orders/:id — update status (RBAC: orders.write). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'orders.write')) {
    return forbidden('ليس لديك صلاحية لتحديث الطلبات')
  }
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string') {
    return validationError({ status: ['status is required'] })
  }
  try {
    const result = await updateOrderStatus(id, status)
    return ok(result)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'تعذر تحديث الطلب' },
      { status: 400 },
    )
  }
}
