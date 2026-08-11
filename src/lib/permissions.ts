/**
 * Authorization
 *
 * Role-based access control for the admin API.
 * Replaces Supabase RLS policies.
 *
 * Roles:
 *   - owner      → full access
 *   - manager    → operational management
 *   - employee   → limited operational access
 */

import { getDb } from '@/db'
import { profiles } from '@/db/schema/auth'
import type { UserRole } from '@/db/schema/auth'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export type Role = UserRole

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  manager: 2,
  employee: 1,
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'المالك',
  manager: 'مدير',
  employee: 'موظف',
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: ['*'],
  manager: [
    'dashboard.read',
    'orders.read', 'orders.write',
    'products.read', 'products.write',
    'categories.read', 'categories.write',
    'customers.read', 'customers.write',
    'delivery.read', 'delivery.write',
    'branches.read',
    'reports.read',
    'reviews.read', 'reviews.write',
    'social.read', 'social.write',
    'settings.read', 'settings.write',
    'suppliers.read', 'suppliers.write',
    'inventory.read', 'inventory.write',
    'offers.read', 'offers.write',
    'returns.read', 'returns.write',
    'promos.read', 'promos.write',
    'media.read', 'media.write',
    'imports.read', 'imports.write',
    'staff.read', 'staff.write',
  ],
  employee: [
    'dashboard.read',
    'orders.read',
    'products.read',
    'customers.read',
    'delivery.read',
    'branches.read',
  ],
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes('*') || permissions.includes(permission)
}

/**
 * Check if a role meets or exceeds the required role level.
 */
export function hasRoleLevel(role: Role, minimumRole: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole]
}

/**
 * Get user with their branch assignment.
 */
export async function getUserWithBranch(userId: string) {
  return getDb().query.profiles.findFirst({
    where: eq(profiles.id, userId),
    with: {
      branch: true,
    },
  })
}

/**
 * Get the primary branch ID for a user.
 */
export async function getPrimaryBranchId(userId: string): Promise<string | null> {
  const user = await getUserWithBranch(userId)
  return user?.branch_id ?? null
}

/**
 * Ensure the user has access to a branch.
 * Owners can access any branch. Others must have a branch assignment.
 */
export async function assertBranchAccess(userId: string, branchId: string): Promise<void> {
  const user = await getDb().query.profiles.findFirst({
    where: eq(profiles.id, userId),
    with: {
      branch: true,
    },
  })

  if (!user) {
    logger.warn('Authorization: user not found', { userId })
    throw new Error('المستخدم غير موجود')
  }

  if (user.role === 'owner') {
    return // Owner can access any branch
  }

  if (!user.branch_id) {
    logger.warn('Authorization: branch access denied — no branch assigned', { userId, branchId })
    throw new Error('ليس لديك صلاحية للوصول إلى هذا الفرع')
  }

  if (user.branch_id !== branchId) {
    logger.warn('Authorization: branch access denied — wrong branch', { userId, branchId, userBranch: user.branch_id })
    throw new Error('ليس لديك صلاحية للوصول إلى هذا الفرع')
  }
}

/**
 * Middleware helper: attach authorization context to the request.
 */
export interface AuthContext {
  user: typeof profiles.$inferSelect
  branchId: string | null
}

export function createAuthContext(user: typeof profiles.$inferSelect, branchId: string | null): AuthContext {
  return { user, branchId }
}











