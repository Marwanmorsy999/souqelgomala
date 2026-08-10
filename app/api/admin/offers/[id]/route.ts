import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { updateOffer, softDeleteOffer } from '@/services/catalog/admin-offers-service'
import { adminOfferSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/offers/:id — update a campaign offer (RBAC: offers.write). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'offers.write')) {
    return forbidden('ليس لديك صلاحية لإدارة العروض')
  }
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = adminOfferSchema.partial().safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const result = await updateOffer(auth.user, id, parsed.data)
    return ok(result)
  } catch (err) {
    return validationError({ offer: [(err as Error).message ?? 'تعذر تحديث العرض'] })
  }
}

/** DELETE /api/admin/offers/:id — soft delete a campaign offer (RBAC: offers.write). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'offers.write')) {
    return forbidden('ليس لديك صلاحية لإدارة العروض')
  }
  const { id } = await params
  try {
    const result = await softDeleteOffer(auth.user, id)
    return ok(result)
  } catch (err) {
    return validationError({ offer: [(err as Error).message ?? 'تعذر حذف العرض'] })
  }
}