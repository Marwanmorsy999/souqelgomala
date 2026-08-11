import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { syncAllSocial } from '@/services/social-sync'

export const dynamic = 'force-dynamic'

/**
 * Manual social feed sync trigger.
 *
 * POST /api/admin/social/sync — runs the Meta Graph + TikTok Display syncs
 * (runs no-op per platform when its credentials are absent) and upserts the
 * results into D1. RBAC: social.write. Used by the admin "Sync now" button.
 */
export async function POST(_request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'social.write')) {
    return forbidden('ليس لديك صلاحية لمزامنة منشورات السوشيال ميديا')
  }

  try {
    const result = await syncAllSocial()
    return ok(result)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشلت مزامنة المنشورات')
  }
}
