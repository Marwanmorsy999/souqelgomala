import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import {
  attachProductMedia,
  updateProductMediaOrder,
  deleteProductMedia,
} from '@/services/catalog/admin-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError } from '@/services/api-response'
import { attachProductMediaSchema, updateProductMediaOrderSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * Admin product media endpoints.
 *
 * POST   /api/admin/products/media — attach a media record after Cloudinary upload.
 * PATCH  /api/admin/products/media — reorder / set-primary media.
 *
 * Authorization enforced server-side (products.write).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'products.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المنتجات')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = attachProductMediaSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const row = await attachProductMedia(auth.user, parsed.data)
    return ok(row, 201)
  } catch (err) {
    return validationError({ media: [(err as Error).message ?? 'تعذر إضافة الصورة'] })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'products.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المنتجات')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = updateProductMediaOrderSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const result = await updateProductMediaOrder(auth.user, parsed.data)
    return ok(result)
  } catch (err) {
    return validationError({ media: [(err as Error).message ?? 'تعذر تحديث ترتيب الصور'] })
  }
}

/**
 * DELETE /api/admin/products/media?id=... — delete a media record + Cloudinary asset.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'products.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المنتجات')
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return validationError({ id: ['id is required'] })

  try {
    const result = await deleteProductMedia(auth.user, id)
    return ok(result)
  } catch (err) {
    return validationError({ media: [(err as Error).message ?? 'تعذر حذف الصورة'] })
  }
}
