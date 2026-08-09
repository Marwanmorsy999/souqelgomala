import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { updateProduct } from '@/services/catalog/admin-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError } from '@/services/api-response'
import { updateProductSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * Admin product endpoint.
 *
 * PATCH /api/admin/products/:id — update a product (RBAC: products.write).
 * Authorization enforced server-side; input Zod-validated.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'products.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المنتجات')
  }

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = updateProductSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const row = await updateProduct(auth.user, id, parsed.data)
    return ok(row)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'تعذر تحديث المنتج' },
      { status }
    )
  }
}
