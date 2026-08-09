import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { createProduct, softDeleteProduct } from '@/services/catalog/admin-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError } from '@/services/api-response'
import { createProductSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * Admin products endpoint.
 *
 * POST /api/admin/products — create a product (RBAC: products.write).
 * DELETE /api/admin/products?id=... — soft-delete a product (RBAC: products.write).
 *
 * Authorization is enforced server-side. Input is Zod-validated before write.
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
  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const row = await createProduct(auth.user, parsed.data)
    return ok(row, 201)
  } catch (err) {
    return validationError({ product: [(err as Error).message ?? 'تعذر إنشاء المنتج'] })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'products.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المنتجات')
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return validationError({ id: ['id is required'] })

  try {
    const result = await softDeleteProduct(auth.user, id)
    return ok(result)
  } catch (err) {
    return validationError({ product: [(err as Error).message ?? 'تعذر حذف المنتج'] })
  }
}
