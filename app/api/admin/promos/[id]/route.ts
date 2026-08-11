import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { updatePromo, softDeletePromo } from '@/services/catalog/admin-promos-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError } from '@/services/api-response'
import { updatePromoSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'promos.write')) {
    return forbidden('ليس لديك صلاحية لتعديل المحتوى')
  }
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = updatePromoSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await updatePromo(auth.user, id, parsed.data)
    return ok(row)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'تعذر تحديث البانر' },
      { status }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'promos.write')) {
    return forbidden('ليس لديك صلاحية لحذف المحتوى')
  }
  const { id } = await params
  try {
    const result = await softDeletePromo(auth.user, id)
    return ok(result)
  } catch (err) {
    return validationError({ promo: [(err as Error).message ?? 'تعذر حذف البانر'] })
  }
}
