import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { bulkUpdateProducts } from '@/services/catalog/admin-import-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { bulkActionSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'products.write')) {
    return forbidden('ليس لديك صلاحية لتعديل المنتجات')
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = bulkActionSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const result = await bulkUpdateProducts(auth.user, parsed.data)
    return ok(result)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'فشل تنفيذ الإجراء المجمع' },
      { status }
    )
  }
}
