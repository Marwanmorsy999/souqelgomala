import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { listPromosAdmin, createPromo } from '@/services/catalog/admin-promos-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { createPromoSchema } from '@/lib/validations'
import type { PromoPlacement } from '@/db/schema/promos'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'promos.read')) {
    return forbidden('ليس لديك صلاحية لعرض المحتوى')
  }
  try {
    const placement = request.nextUrl.searchParams.get('placement') as PromoPlacement | undefined
    const rows = await listPromosAdmin({ placement })
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل المحتوى')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'promos.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المحتوى')
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = createPromoSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await createPromo(auth.user, parsed.data)
    return ok(row, 201)
  } catch (err) {
    return validationError({ promo: [(err as Error).message ?? 'تعذر إنشاء البانر'] })
  }
}
