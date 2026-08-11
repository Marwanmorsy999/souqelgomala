import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, fail, validationError, serverError } from '@/services/api-response'
import {
  updateCategory,
  deleteCategoryWithCheck,
  countProductsInCategory,
} from '@/services/catalog/admin-service'

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

/**
 * GET /api/admin/categories/:id/product-count — preview dependency before delete.
 * DELETE /api/admin/categories/:id — delete with dependency check + optional reassign.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'categories.read')) {
    return forbidden('ليس لديك صلاحية لعرض الأقسام')
  }
  const { id } = await params
  try {
    const count = await countProductsInCategory(id)
    return ok({ categoryId: id, productCount: count })
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر حساب المنتجات')
  }
}

/** DELETE /api/admin/categories/:id — delete with dependency check (RBAC: categories.write). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'categories.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الأقسام')
  }
  const { id } = await params
  const reassignTo = request.nextUrl.searchParams.get('reassignTo') ?? undefined
  try {
    const result = await deleteCategoryWithCheck(auth.user, id, reassignTo)
    return ok(result)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400
    return fail((err as Error).message ?? 'تعذر حذف القسم', status)
  }
}

