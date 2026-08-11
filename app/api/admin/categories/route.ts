import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import {
  listCategoriesAdmin,
  createCategory,
  reorderCategories,
} from '@/services/catalog/admin-service'
import {
  createCategorySchema,
  reorderCategoriesSchema,
} from '@/lib/validations'

export const dynamic = 'force-dynamic'

/** GET /api/admin/categories — list all categories (RBAC: categories.read). */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'categories.read')) {
    return forbidden('ليس لديك صلاحية لعرض الأقسام')
  }
  try {
    const rows = await listCategoriesAdmin()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل الأقسام')
  }
}

/** POST /api/admin/categories — create (RBAC: categories.write). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'categories.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الأقسام')
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await createCategory(auth.user, {
      nameAr: parsed.data.nameAr,
      nameEn: parsed.data.nameEn,
      parentId: parsed.data.parentId,
      image: parsed.data.image,
      sortOrder: parsed.data.sortOrder,
      isVisible: parsed.data.isVisible,
    })
    return ok(row, 201)
  } catch (err) {
    return validationError({ category: [(err as Error).message ?? 'تعذر إنشاء القسم'] })
  }
}

/** PATCH /api/admin/categories/reorder — drag-reorder (RBAC: categories.write). */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'categories.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الأقسام')
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = reorderCategoriesSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    await reorderCategories(auth.user, parsed.data.ids)
    return ok({ success: true })
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر إعادة الترتيب')
  }
}
