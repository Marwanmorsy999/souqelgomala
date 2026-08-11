import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import {
  updateFooterLink,
  deleteFooterLink,
} from '@/services/site-structure-service'
import { updateFooterLinkSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.write')) {
    return forbidden('ليس لديك صلاحية لتعديل الإعدادات')
  }
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = updateFooterLinkSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await updateFooterLink(auth.user, id, parsed.data)
    return ok(row)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'تعذر تحديث الرابط' },
      { status },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'settings.write')) {
    return forbidden('ليس لديك صلاحية لحذف الإعدادات')
  }
  const { id } = await params
  try {
    await deleteFooterLink(auth.user, id)
    return ok({ success: true })
  } catch (err) {
    return validationError({ footerLink: [(err as Error).message ?? 'تعذر حذف الرابط'] })
  }
}
