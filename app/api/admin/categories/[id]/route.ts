import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { softDeleteCategory } from '@/services/catalog/admin-service'

export const dynamic = 'force-dynamic'

/** DELETE /api/admin/categories/:id — soft delete (RBAC: categories.write). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'categories.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الأقسام')
  }
  const { id } = await params
  try {
    const result = await softDeleteCategory(auth.user, id)
    return ok(result)
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر حذف القسم')
  }
}
