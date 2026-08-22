import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, fail } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { deleteBranch, updateBranch } from '@/services/branches-service'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/branches/:id — update a branch (RBAC: settings.write). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الفروع')
  }
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body', 400)
  }
  const raw = body as Record<string, unknown>

  const patch: Parameters<typeof updateBranch>[1] = {}
  if (typeof raw.nameAr === 'string' && raw.nameAr.trim()) patch.nameAr = raw.nameAr
  else if (typeof raw.nameAr === 'string') return fail('اسم الفرع مطلوب', 422)
  if (typeof raw.nameEn === 'string') patch.nameEn = raw.nameEn
  if (typeof raw.code === 'string') patch.code = raw.code
  if (typeof raw.address === 'string') patch.address = raw.address
  if (typeof raw.phone === 'string') patch.phone = raw.phone
  if (typeof raw.mapsUrl === 'string') patch.mapsUrl = raw.mapsUrl
  if (typeof raw.isActive === 'boolean') patch.isActive = raw.isActive

  try {
    await updateBranch(id, patch)
    return ok({ success: true })
  } catch (err) {
    return fail((err as Error).message ?? 'تعذر تحديث الفرع', 400)
  }
}

/** DELETE /api/admin/branches/:id — soft-delete a branch (RBAC: settings.write). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الفروع')
  }
  const { id } = await params
  try {
    await deleteBranch(id)
    return ok({ success: true })
  } catch (err) {
    return fail((err as Error).message ?? 'تعذر حذف الفرع', 400)
  }
}
