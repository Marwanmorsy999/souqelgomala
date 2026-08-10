import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { getSiteSettings, updateSiteSettings } from '@/services/settings'
import { siteSettingsSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * Admin settings endpoint.
 *
 * GET /api/admin/settings — current site settings (RBAC: settings.read)
 * PUT /api/admin/settings — update site settings (RBAC: settings.write)
 *
 * Changes persist to the D1 `settings` table and invalidate the KV cache so
 * the storefront reflects them on its next read.
 */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.read')) {
    return forbidden('ليس لديك صلاحية لعرض الإعدادات')
  }
  try {
    const settings = await getSiteSettings()
    return ok(settings)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل الإعدادات')
  }
}

export async function PUT(request: NextRequest) {
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
  const parsed = siteSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const saved = await updateSiteSettings(auth.user, parsed.data)
    return ok(saved)
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر حفظ الإعدادات')
  }
}