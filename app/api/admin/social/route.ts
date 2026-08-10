import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { listSocialPostsAdmin, createSocialPost } from '@/services/social'
import { createSocialPostSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * Admin social posts endpoints.
 *
 * GET  /api/admin/social — list all posts (RBAC: social.read)
 * POST /api/admin/social — create a post (RBAC: social.write)
 */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'social.read')) {
    return forbidden('ليس لديك صلاحية لعرض منشورات السوشيال ميديا')
  }
  try {
    const rows = await listSocialPostsAdmin()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل المنشورات')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'social.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المنشورات')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = createSocialPostSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const row = await createSocialPost(auth.user, parsed.data)
    return ok(row, 201)
  } catch (err) {
    return validationError({ post: [(err as Error).message ?? 'تعذر إنشاء المنشور'] })
  }
}