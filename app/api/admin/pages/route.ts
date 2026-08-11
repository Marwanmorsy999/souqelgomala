import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import {
  listStaticPages,
  createStaticPage,
} from '@/services/site-structure-service'
import { createStaticPageSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.read')) {
    return forbidden('ليس لديك صلاحية لعرض الإعدادات')
  }
  try {
    const rows = await listStaticPages()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل الصفحات')
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
  const parsed = createStaticPageSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await createStaticPage(auth.user, parsed.data)
    return ok(row, 201)
  } catch (err) {
    return validationError({ page: [(err as Error).message ?? 'تعذر إنشاء الصفحة'] })
  }
}
