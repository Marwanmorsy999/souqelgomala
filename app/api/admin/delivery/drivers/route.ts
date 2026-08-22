import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { createDriver, listDrivers, type DriverRow } from '@/services/delivery-service'

export const dynamic = 'force-dynamic'

/** GET /api/admin/delivery/drivers — list couriers (RBAC: delivery.read). */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'delivery.read')) {
    return forbidden('ليس لديك صلاحية لعرض المناديب')
  }
  try {
    const rows = await listDrivers()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل المناديب')
  }
}

/** POST /api/admin/delivery/drivers — create a courier (RBAC: delivery.write). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'delivery.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المناديب')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const raw = body as Record<string, unknown>
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const phone = typeof raw.phone === 'string' ? raw.phone.trim() : ''

  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ['اسم المندوب مطلوب']
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) errors.phone = ['رقم هاتف غير صالح']
  if (raw.status !== undefined && !['available', 'busy', 'offline'].includes(String(raw.status))) {
    errors.status = ['حالة غير صالحة']
  }
  if (Object.keys(errors).length > 0) return validationError(errors)

  try {
    const row = await createDriver({
      name,
      phone,
      vehicle: typeof raw.vehicle === 'string' ? raw.vehicle : undefined,
      status: raw.status as DriverRow['status'] | undefined,
    })
    return ok(row, 201)
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر إنشاء المندوب')
  }
}
