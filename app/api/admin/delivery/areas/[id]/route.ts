import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, fail } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { deleteArea, updateArea } from '@/services/delivery-service'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/delivery/areas/:id — update a delivery zone (RBAC: delivery.write). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'delivery.write')) {
    return forbidden('ليس لديك صلاحية لإدارة مناطق التوصيل')
  }
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body', 400)
  }
  const raw = body as Record<string, unknown>

  const patch: Parameters<typeof updateArea>[1] = {}
  if (typeof raw.name === 'string' && raw.name.trim()) patch.name = raw.name
  if (typeof raw.city === 'string' && raw.city.trim()) patch.city = raw.city
  if (raw.fee !== undefined) {
    const fee = Number(raw.fee)
    if (!Number.isFinite(fee) || fee < 0) return fail('رسوم غير صالحة', 422)
    patch.fee = fee
  }
  if (raw.minOrder !== undefined) {
    const minOrder = Number(raw.minOrder)
    if (!Number.isFinite(minOrder) || minOrder < 0) return fail('حد أدنى غير صالح', 422)
    patch.minOrder = minOrder
  }
  if (typeof raw.isActive === 'boolean') patch.isActive = raw.isActive

  try {
    await updateArea(id, patch)
    return ok({ success: true })
  } catch (err) {
    return fail((err as Error).message ?? 'تعذر تحديث المنطقة', 400)
  }
}

/** DELETE /api/admin/delivery/areas/:id — soft-delete a zone (RBAC: delivery.write). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'delivery.write')) {
    return forbidden('ليس لديك صلاحية لإدارة مناطق التوصيل')
  }
  const { id } = await params
  try {
    await deleteArea(id)
    return ok({ success: true })
  } catch (err) {
    return fail((err as Error).message ?? 'تعذر حذف المنطقة', 400)
  }
}
