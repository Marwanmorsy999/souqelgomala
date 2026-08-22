import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, fail } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { createEmployee, listEmployees } from '@/services/employees-service'
import type { UserRole } from '@/db/schema/auth'

export const dynamic = 'force-dynamic'

/** GET /api/admin/employees — list staff accounts (RBAC: staff.read). */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'staff.read')) {
    return forbidden('ليس لديك صلاحية لعرض الموظفين')
  }
  try {
    const rows = await listEmployees()
    return ok(rows)
  } catch (err) {
    return fail((err as Error).message ?? 'فشل تحميل الموظفين', 500)
  }
}

/** POST /api/admin/employees — create a staff account (RBAC: staff.write). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'staff.write')) {
    return forbidden('ليس لديك صلاحية لإدارة الموظفين')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body', 400)
  }
  const raw = body as Record<string, unknown>

  const fullName = typeof raw.fullName === 'string' ? raw.fullName.trim() : ''
  const email = typeof raw.email === 'string' ? raw.email.trim() : ''
  const password = typeof raw.password === 'string' ? raw.password : ''
  const role = String(raw.role ?? 'employee') as UserRole

  const errors: string[] = []
  if (!fullName) errors.push('اسم الموظف مطلوب')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('بريد إلكتروني غير صالح')
  if (password.length < 8) errors.push('كلمة المرور يجب أن تكون ٨ أحرف على الأقل')
  if (!['owner', 'manager', 'employee'].includes(role)) errors.push('الدور غير صالح')
  if (role === 'owner' && auth.user.role !== 'owner') errors.push('فقط المالك يمكنه إنشاء حساب مالك')
  if (errors.length > 0) return fail(errors.join(' — '), 422)

  try {
    const row = await createEmployee({
      fullName,
      email,
      password,
      phone: typeof raw.phone === 'string' ? raw.phone : undefined,
      role,
      branchId: typeof raw.branchId === 'string' && raw.branchId ? raw.branchId : null,
    })
    return ok(row, 201)
  } catch (err) {
    return fail((err as Error).message ?? 'تعذر إنشاء حساب الموظف', 422)
  }
}
