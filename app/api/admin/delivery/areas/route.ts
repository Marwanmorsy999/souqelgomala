import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { createArea, listAreas } from '@/services/delivery-service'

export const dynamic = 'force-dynamic'

/** GET /api/admin/delivery/areas — list delivery zones (RBAC: delivery.read). */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'delivery.read')) {
    return forbidden('ليس لديك صلاحية لعرض مناطق التوصيل')
  }
  try {
    const rows = await listAreas()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل مناطق التوصيل')
  }
}

/** POST /api/admin/delivery/areas — create a zone (RBAC: delivery.write). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'delivery.write')) {
    return forbidden('ليس لديك صلاحية لإدارة مناطق التوصيل')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const raw = body as Record<string, unknown>
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const city = typeof raw.city === 'string' ? raw.city.trim() : ''
  const feeRaw = Number(raw.fee ?? 0)
  const minOrderRaw = Number(raw.minOrder ?? 0)

  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ['اسم المنطقة مطلوب']
  if (!city) errors.city = ['المدينة مطلوبة']
  if (!Number.isFinite(feeRaw) || feeRaw < 0) errors.fee = ['رسوم غير صالحة']
  if (!Number.isFinite(minOrderRaw) || minOrderRaw < 0) errors.minOrder = ['حد أدنى غير صالح']
  if (Object.keys(errors).length > 0) return validationError(errors)

  try {
    const row = await createArea({
      name,
      city,
      fee: feeRaw,
      minOrder: minOrderRaw,
      isActive: raw.isActive === undefined ? true : Boolean(raw.isActive),
    })
    return ok(row, 201)
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر إنشاء المنطقة')
  }
}
