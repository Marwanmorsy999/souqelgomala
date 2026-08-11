import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { softDeleteMedia } from '@/services/catalog/admin-media-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden } from '@/services/api-response'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'media.write')) {
    return forbidden('ليس لديك صلاحية لحذف الوسائط')
  }
  try {
    const { id } = await params
    const result = await softDeleteMedia(auth.user, id)
    return ok(result)
  } catch (err) {
    const message = (err as Error).message ?? 'تعذر حذف الوسيط'
    const status = (err as { status?: number }).status === 403 ? 403 : 400
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  }
}
