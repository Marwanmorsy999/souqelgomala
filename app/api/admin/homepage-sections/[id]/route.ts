import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, validationError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import {
  updateHomepageSectionVisibility,
} from '@/services/site-structure-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const visibilitySchema = z.object({
  visible: z.boolean(),
})

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
  const parsed = visibilitySchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const row = await updateHomepageSectionVisibility(auth.user, id, parsed.data.visible)
    return ok(row)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'تعذر تحديث القسم' },
      { status },
    )
  }
}
