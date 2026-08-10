import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { updateSocialPost, softDeleteSocialPost } from '@/services/social'
import { updateSocialPostSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/social/:id — update a post (RBAC: social.write). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'social.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المنشورات')
  }
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = updateSocialPostSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }

  try {
    const result = await updateSocialPost(auth.user, id, parsed.data)
    return ok(result)
  } catch (err) {
    return validationError({ post: [(err as Error).message ?? 'تعذر تحديث المنشور'] })
  }
}

/** DELETE /api/admin/social/:id — soft delete a post (RBAC: social.write). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'social.write')) {
    return forbidden('ليس لديك صلاحية لإدارة المنشورات')
  }
  const { id } = await params
  try {
    const result = await softDeleteSocialPost(auth.user, id)
    return ok(result)
  } catch (err) {
    return validationError({ post: [(err as Error).message ?? 'تعذر حذف المنشور'] })
  }
}