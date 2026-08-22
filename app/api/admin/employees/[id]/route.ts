import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, fail } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { deleteEmployee, updateEmployee } from '@/services/employees-service'
import type { UserRole } from '@/db/schema/auth'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/employees/:id — update a staff account (RBAC: staff.write). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'staff.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الموظفين')
  }
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body', 400)
  }
  const raw = body as Record<string, unknown>

  const patch: Parameters<typeof updateEmployee>[3] = {}
  if (typeof raw.fullName === 'string' && raw.fullName.trim()) patch.fullName = raw.fullName
  if (typeof raw.phone === 'string') patch.phone = raw.phone
  if (typeof raw.role === 'string') patch.role = raw.role as UserRole
  if (typeof raw.isActive === 'boolean') patch.isActive = raw.isActive
  if (raw.branchId !== undefined) patch.branchId = typeof raw.branchId === 'string' && raw.branchId ? raw.branchId : null
  if (typeof raw.password === 'string' && raw.password) patch.password = raw.password

  try {
    await updateEmployee(auth.user.id, auth.user.role as UserRole, id, patch)
    return ok({ success: true })
  } catch (err) {
    return fail((err as Error).message ?? 'تعذر تحديث حساب الموظف', 422)
  }
}

/** DELETE /api/admin/employees/:id — soft-delete a staff account (RBAC: staff.write). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'staff.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الموظفين')
  }
  const { id } = await params
  try {
    await deleteEmployee(auth.user.id, id)
    return ok({ success: true })
  } catch (err) {
    return fail((err as Error).message ?? 'تعذر حذف حساب الموظف', 422)
  }
}
