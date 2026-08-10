import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { createProduct, softDeleteProduct, listProductsAdmin } from '@/services/catalog/admin-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { createProductSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * Admin products endpoint.
 *
 * GET    /api/admin/products — product list incl. hidden/inactive (RBAC: products.read)
 * POST   /api/admin/products — create a product (RBAC: products.write)
 * DELETE /api/admin/products?id=... — soft-delete a product (RBAC: products.write)
 *
 * Authorization is enforced server-side. Input is Zod-validated before write.
 */

/** GET /api/admin/products — list products for the admin table. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'products.read')) {
    return forbidden('ليس لديك صلاحية لعرض المنتجات')
  }
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const categoryId = request.nextUrl.searchParams.get('categoryId') ?? undefined
    const result = await listProductsAdmin({ search, categoryId })
    return ok(result)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل المنتجات')
  }
}


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
