import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { softDeleteCategory, updateCategory } from '@/services/catalog/admin-service'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/categories/:id — update a category (RBAC: categories.write). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'categories.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الأقسام')
  }
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const b = body as Record<string, unknown>

  try {
    const result = await updateCategory(auth.user, id, {
      nameAr: typeof b.nameAr === 'string' ? b.nameAr : undefined,
      nameEn: typeof b.nameEn === 'string' ? b.nameEn : undefined,
      parentId: typeof b.parentId === 'string' ? b.parentId : undefined,
      image: typeof b.image === 'string' ? b.image : undefined,
      sortOrder: typeof b.sortOrder === 'number' ? b.sortOrder : undefined,
      isVisible: typeof b.isVisible === 'boolean' ? b.isVisible : undefined,
    })
    return ok(result)
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر تحديث القسم')
  }
}

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
