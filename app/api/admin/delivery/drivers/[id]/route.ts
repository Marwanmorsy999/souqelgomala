import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, fail } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { deleteDriver, updateDriver, type DriverStatus } from '@/services/delivery-service'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/delivery/drivers/:id — update courier (RBAC: delivery.write). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'delivery.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المناديب')
  }
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body', 400)
  }
  const raw = body as Record<string, unknown>

  const patch: Parameters<typeof updateDriver>[1] = {}
  if (typeof raw.name === 'string' && raw.name.trim()) patch.name = raw.name
  if (typeof raw.phone === 'string' && raw.phone.replace(/\D/g, '').length >= 10) patch.phone = raw.phone
  else if (typeof raw.phone === 'string') return fail('رقم هاتف غير صالح', 422)
  if (typeof raw.vehicle === 'string') patch.vehicle = raw.vehicle
  if (
    typeof raw.status === 'string' &&
    ['available', 'busy', 'offline'].includes(raw.status)
  ) {
    patch.status = raw.status as DriverStatus
  } else if (typeof raw.status === 'string') {
    return fail('حالة غير صالحة', 422)
  }

  try {
    await updateDriver(id, patch)
    return ok({ success: true })
  } catch (err) {
    return fail((err as Error).message ?? 'تعذر تحديث المندوب', 400)
  }
}

/** DELETE /api/admin/delivery/drivers/:id — soft-delete a courier (RBAC: delivery.write). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'delivery.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المناديب')
  }
  const { id } = await params
  try {
    await deleteDriver(id)
    return ok({ success: true })
  } catch (err) {
    return fail((err as Error).message ?? 'تعذر حذف المندوب', 400)
  }
}
