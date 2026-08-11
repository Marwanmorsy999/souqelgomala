import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { listMediaAdmin, createMediaRecord } from '@/services/catalog/admin-media-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { mediaLibrarySchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'media.read')) {
    return forbidden('ليس لديك صلاحية لعرض الوسائط')
  }
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const tag = request.nextUrl.searchParams.get('tag') ?? undefined
    const unused = request.nextUrl.searchParams.get('unused') === 'true'
    const rows = await listMediaAdmin({ search, tag, unused })
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل الوسائط')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'media.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الوسائط')
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = mediaLibrarySchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await createMediaRecord(auth.user, parsed.data)
    return ok(row, 201)
  } catch (err) {
    return validationError({ media: [(err as Error).message ?? 'تعذر إنشاء سجل الوسيط'] })
  }
}
