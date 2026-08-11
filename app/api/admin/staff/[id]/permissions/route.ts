import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'
import { staffPermissions } from '@/db/schema/staff'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { staffPermissionsSchema, type StaffPermissionsInput } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'staff.read')) {
    return forbidden('ليس لديك صلاحية لعرض الصلاحيات')
  }
  const { id } = await params
  try {
    const row = await getDb().select().from(staffPermissions).where(eq(staffPermissions.staff_id, id)).limit(1)
    return ok(row[0] ?? null)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل الصلاحيات')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'staff.write')) {
    return forbidden('ليس لديك صلاحية لتعديل الصلاحيات')
  }
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const parsed = staffPermissionsSchema.safeParse({ ...body, staffId: id } as StaffPermissionsInput)
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors)
  }
  try {
    const existing = await getDb().select().from(staffPermissions).where(eq(staffPermissions.staff_id, id)).limit(1)
    const ts = new Date().toISOString()
    if (existing[0]) {
      await getDb()
        .update(staffPermissions)
        .set({
          can_edit_products: parsed.data.canEditProducts,
          can_edit_prices: parsed.data.canEditPrices,
          can_edit_promos: parsed.data.canEditPromos,
          can_manage_staff: parsed.data.canManageStaff,
          can_view_reports: parsed.data.canViewReports,
          updated_at: ts,
        })
        .where(eq(staffPermissions.staff_id, id))
    } else {
      await getDb().insert(staffPermissions).values({
        staff_id: id,
        can_edit_products: parsed.data.canEditProducts,
        can_edit_prices: parsed.data.canEditPrices,
        can_edit_promos: parsed.data.canEditPromos,
        can_manage_staff: parsed.data.canManageStaff,
        can_view_reports: parsed.data.canViewReports,
        updated_at: ts,
      })
    }
    return ok({ success: true })
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحديث الصلاحيات')
  }
}
