import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import {
  listOffersAdmin,
  createOffer,
} from '@/services/catalog/admin-offers-service'
import { adminOfferSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * Admin offers endpoints.
 *
 * GET  /api/admin/offers  — list all campaign offers (RBAC: offers.read)
 * POST /api/admin/offers  — create a campaign offer (RBAC: offers.write)
 *
 * Authorization enforced server-side; input Zod-validated before insert.
 */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'offers.read')) {
    return forbidden('ليس لديك صلاحية لعرض العروض')
  }
  try {
    const rows = await listOffersAdmin()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل العروض')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'offers.write')) {
    return forbidden('ليس لديك صلاحية لإدارة العروض')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = adminOfferSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const row = await createOffer(auth.user, parsed.data)
    return ok(row, 201)
  } catch (err) {
    return validationError({ offer: [(err as Error).message ?? 'تعذر إنشاء العرض'] })
  }
}