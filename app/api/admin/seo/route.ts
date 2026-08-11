import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import {
  listSeoSettings,
  upsertSeoSettings,
} from '@/services/site-structure-service'
import { createSeoSettingsSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.read')) {
    return forbidden('ليس لديك صلاحية لعرض الإعدادات')
  }
  try {
    const rows = await listSeoSettings()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل إعدادات SEO')
  }
}

export async function PATCH(request: NextRequest) {
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
  const parsed = createSeoSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await upsertSeoSettings(auth.user, parsed.data)
    return ok(row)
  } catch (err) {
    return validationError({ seo: [(err as Error).message ?? 'تعذر حفظ إعدادات SEO'] })
  }
}
