import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import {
  updateDeliveryZone,
  deleteDeliveryZone,
} from '@/services/site-structure-service'
import { updateDeliveryZoneSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.write')) {
    return forbidden('ليس لديك صلاحية لتعديل الإعدادات')
  }
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = updateDeliveryZoneSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await updateDeliveryZone(auth.user, id, parsed.data)
    return ok(row)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'تعذر تحديث المنطقة' },
      { status },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.write')) {
    return forbidden('ليس لديك صلاحية لحذف الإعدادات')
  }
  const { id } = await params
  try {
    await deleteDeliveryZone(auth.user, id)
    return ok({ success: true })
  } catch (err) {
    return validationError({ deliveryZone: [(err as Error).message ?? 'تعذر حذف المنطقة'] })
  }
}
