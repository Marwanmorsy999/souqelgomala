/**
 * Employees service — staff account management over the `profiles` table.
 *
 * - Listing is RBAC-gated (staff.read) by the route handler.
 * - Creating requires a password (PBKDF2-hashed via lib/crypto).
 * - Deleting is a soft delete so order/audit history stays intact.
 * - The last active owner can never be deactivated (locks the owner out).
 */

import { getDb } from '@/db'
import { profiles, type UserRole } from '@/db/schema/auth'
import { branches } from '@/db/schema/branches'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { hashPassword } from '@/lib/crypto'

function now(): string {
  return new Date().toISOString()
}

const VALID_ROLES: UserRole[] = ['owner', 'manager', 'employee']

export interface EmployeeRow {
  id: string
  email: string | null
  fullName: string
  phone: string | null
  role: UserRole
  branchId: string | null
  branchName: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export async function listEmployees(): Promise<EmployeeRow[]> {
  const rows = await getDb()
    .select({
      id: profiles.id,
      email: profiles.email,
      full_name: profiles.full_name,
      phone: profiles.phone,
      role: profiles.role,
      branch_id: profiles.branch_id,
      is_active: profiles.is_active,
      last_login_at: profiles.last_login_at,
      created_at: profiles.created_at,
      branch_name: branches.name_ar,
    })
    .from(profiles)
    .leftJoin(branches, eq(profiles.branch_id, branches.id))
    .where(isNull(profiles.deleted_at))
    .orderBy(asc(profiles.full_name))

  return rows.map((r) => ({
    id: r.id,
    email: r.email ?? null,
    fullName: r.full_name,
    phone: r.phone ?? null,
    role: r.role as UserRole,
    branchId: r.branch_id ?? null,
    branchName: r.branch_name ?? null,
    isActive: r.is_active,
    lastLoginAt: r.last_login_at ?? null,
    createdAt: r.created_at,
  }))
}

export async function createEmployee(input: {
  fullName: string
  email: string
  password: string
  phone?: string
  role: UserRole
  branchId?: string | null
}): Promise<EmployeeRow> {
  if (!VALID_ROLES.includes(input.role)) throw new Error('الدور غير صالح')
  if (input.password.length < 8) throw new Error('كلمة المرور يجب أن تكون ٨ أحرف على الأقل')

  const [existing] = await getDb()
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, input.email.toLowerCase()))
    .limit(1)
  if (existing) throw new Error('هذا البريد الإلكتروني مستخدم بالفعل')

  const ts = now()
  await getDb().insert(profiles).values({
    id: crypto.randomUUID(),
    email: input.email.toLowerCase(),
    full_name: input.fullName.trim(),
    phone: input.phone?.trim() || null,
    password_hash: await hashPassword(input.password),
    role: input.role,
    branch_id: input.branchId || null,
    is_active: true,
    created_at: ts,
    updated_at: ts,
  })

  const all = await listEmployees()
  const row = all.find((e) => e.email === input.email.toLowerCase())
  if (!row) throw new Error('تعذر إنشاء حساب الموظف')
  return row
}

export async function updateEmployee(
  actorId: string,
  actorRole: UserRole,
  id: string,
  patch: Partial<{
    fullName: string
    phone: string
    role: UserRole
    branchId: string | null
    isActive: boolean
    password: string
  }>,
): Promise<void> {
  const [existing] = await getDb().select().from(profiles).where(eq(profiles.id, id)).limit(1)
  if (!existing || existing.deleted_at) throw new Error('الموظف غير موجود')

  // Only owners may promote/demote owners.
  if (patch.role === 'owner' && actorRole !== 'owner') {
    throw new Error('فقط المالك يمكنه تعيين دور مالك')
  }

  // Lock-out guard — cannot deactivate yourself or the last active owner.
  if (patch.isActive === false) {
    if (id === actorId) throw new Error('لا يمكن إيقاف حسابك الشخصي')
    if (existing.role === 'owner' && existing.is_active) {
      const activeOwners = (
        await getDb()
          .select({ id: profiles.id })
          .from(profiles)
          .where(and(eq(profiles.role, 'owner'), eq(profiles.is_active, true), isNull(profiles.deleted_at)))
      ).length
      if (activeOwners <= 1) throw new Error('لا يمكن إيقاف آخر مالك نشط للحساب')
    }
  }

  if (patch.password !== undefined && patch.password !== '') {
    if (patch.password.length < 8) throw new Error('كلمة المرور يجب أن تكون ٨ أحرف على الأقل')
  }
  if (patch.role && !VALID_ROLES.includes(patch.role)) throw new Error('الدور غير صالح')

  await getDb()
    .update(profiles)
    .set({
      ...(patch.fullName !== undefined ? { full_name: patch.fullName.trim() } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone.trim() || null } : {}),
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      ...(patch.branchId !== undefined ? { branch_id: patch.branchId || null } : {}),
      ...(patch.isActive !== undefined ? { is_active: patch.isActive } : {}),
      ...(patch.password ? { password_hash: await hashPassword(patch.password) } : {}),
      updated_at: now(),
    })
    .where(eq(profiles.id, id))
}

export async function deleteEmployee(actorId: string, id: string): Promise<void> {
  if (id === actorId) throw new Error('لا يمكنك حذف حسابك الشخصي')
  const [existing] = await getDb().select().from(profiles).where(eq(profiles.id, id)).limit(1)
  if (!existing || existing.deleted_at) throw new Error('الموظف غير موجود')
  if (existing.role === 'owner') throw new Error('لا يمكن حذف حساب مالك — أوقفه بدلاً من ذلك')
  await getDb()
    .update(profiles)
    .set({ deleted_at: now(), is_active: false, updated_at: now() })
    .where(eq(profiles.id, id))
}
