/**
 * Drizzle schema: Authentication & Authorization
 *
 * Replaces the Supabase `auth.users` + `profiles` model with application-managed
 * user records stored in D1. Passwords are hashed (not stored), sessions use
 * HTTP-only cookies with opaque tokens stored in D1.
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export type UserRole = 'owner' | 'manager' | 'employee'

export const roles = sqliteTable(
  'roles',
  {
    id: text('id').primaryKey(), // e.g. 'owner', 'manager', 'employee'
    label: text('label').notNull(),
    description: text('description'),
    permissions: text('permissions').notNull(), // JSON array of permission strings
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_roles_active: index('idx_roles_active').on(table.is_active),
  })
)

export const profiles = sqliteTable(
  'profiles',
  {
    id: text('id').primaryKey(), // UUID v4 string, application-generated
    email: text('email'),
    full_name: text('full_name').notNull().default(''),
    phone: text('phone'),
    password_hash: text('password_hash'), // null when using SSO / invited
    role: text('role').$type<UserRole>().notNull().default('employee'),
    avatar: text('avatar'),
    branch_id: text('branch_id'),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    last_login_at: text('last_login_at'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_profiles_role: index('idx_profiles_role').on(table.role),
    idx_profiles_branch: index('idx_profiles_branch').on(table.branch_id),
    idx_profiles_email: index('idx_profiles_email').on(table.email),
  })
)

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(), // opaque session token (hashed)
    profile_id: text('profile_id').notNull(),
    session_token: text('session_token').notNull().unique(),
    expires_at: text('expires_at').notNull(),
    user_agent: text('user_agent'),
    ip_address: text('ip_address'),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_sessions_profile: index('idx_sessions_profile').on(table.profile_id),
    idx_sessions_expires: index('idx_sessions_expires').on(table.expires_at),
    idx_sessions_token: index('idx_sessions_token').on(table.session_token),
  })
)

export const authAuditLogs = sqliteTable('auth_audit_logs', {
  id: text('id').primaryKey(),
  profile_id: text('profile_id'),
  action: text('action').notNull(), // login, logout, password_reset, etc.
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  success: integer('success', { mode: 'boolean' }).notNull().default(true),
  metadata: text('metadata'), // JSON
  created_at: text('created_at').notNull(),
})
