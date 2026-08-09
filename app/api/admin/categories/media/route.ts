import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import {
  attachCategoryMedia,
  deleteCategoryMedia,
} from '@/services/catalog/admin-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError } from '@/services/api-response'
import { attachCategoryMediaSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * Admin category media endpoints.
 *
 * POST   /api/admin/categories/media — attach a media record after Cloudinary upload.
 * DELETE /api/admin/categories/media?id=... — delete a media record + Cloudinary asset.
 *
 * Authorization enforced server-side (categories.write).
 */
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
  const parsed = attachCategoryMediaSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const row = await attachCategoryMedia(auth.user, parsed.data)
    return ok(row, 201)
  } catch (err) {
    return validationError({ media: [(err as Error).message ?? 'تعذر إضافة الصورة'] })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'categories.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الأقسام')
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return validationError({ id: ['id is required'] })

  try {
    const result = await deleteCategoryMedia(auth.user, id)
    return ok(result)
  } catch (err) {
    return validationError({ media: [(err as Error).message ?? 'تعذر حذف الصورة'] })
  }
}
