import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, serverError, fail } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { createBranch, listBranches } from '@/services/branches-service'

export const dynamic = 'force-dynamic'

/** GET /api/admin/branches — list branches (RBAC: branches.read). */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'branches.read')) {
    return forbidden('ليس لديك صلاحية لعرض الفروع')
  }
  try {
    const rows = await listBranches()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل الفروع')
  }
}

/** POST /api/admin/branches — create a branch (RBAC: settings.write). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الفروع')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body', 400)
  }
  const raw = body as Record<string, unknown>
  const nameAr = typeof raw.nameAr === 'string' ? raw.nameAr.trim() : ''
  if (!nameAr) {
    return fail('اسم الفرع مطلوب', 422)
  }
  // Basic URL validation when a maps link is provided.
  const mapsUrl = typeof raw.mapsUrl === 'string' ? raw.mapsUrl.trim() : undefined
  if (mapsUrl && !/^https?:\/\//i.test(mapsUrl)) {
    return fail('رابط الخريطة يجب أن يبدأ بـ http أو https', 422)
  }

  try {
    const row = await createBranch({
      nameAr,
      nameEn: typeof raw.nameEn === 'string' ? raw.nameEn : undefined,
      code: typeof raw.code === 'string' ? raw.code : undefined,
      address: typeof raw.address === 'string' ? raw.address : undefined,
      phone: typeof raw.phone === 'string' ? raw.phone : undefined,
      mapsUrl,
      isActive: raw.isActive === undefined ? true : Boolean(raw.isActive),
    })
    return ok(row, 201)
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر إنشاء الفرع')
  }
}
