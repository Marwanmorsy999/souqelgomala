import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import {
  listDeliveryZones,
  createDeliveryZone,
} from '@/services/site-structure-service'
import { createDeliveryZoneSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.read')) {
    return forbidden('ليس لديك صلاحية لعرض الإعدادات')
  }
  try {
    const rows = await listDeliveryZones()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل مناطق التوصيل')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.write')) {
    return forbidden('ليس لديك صلاحية لتعديل الإعدادات')
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = createDeliveryZoneSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await createDeliveryZone(auth.user, parsed.data)
    return ok(row, 201)
  } catch (err) {
    return validationError({ deliveryZone: [(err as Error).message ?? 'تعذر إنشاء المنطقة'] })
  }
}
