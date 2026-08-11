/**
 * Drizzle schema: Staff Permissions (per-staff overrides)
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const staffPermissions = sqliteTable(
  'staff_permissions',
  {
    staff_id: text('staff_id').primaryKey(),
    can_edit_products: integer('can_edit_products', { mode: 'boolean' }).notNull().default(true),
    can_edit_prices: integer('can_edit_prices', { mode: 'boolean' }).notNull().default(true),
    can_edit_promos: integer('can_edit_promos', { mode: 'boolean' }).notNull().default(true),
    can_manage_staff: integer('can_manage_staff', { mode: 'boolean' }).notNull().default(false),
    can_view_reports: integer('can_view_reports', { mode: 'boolean' }).notNull().default(true),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_staff_perm: index('idx_staff_perm').on(table.staff_id),
  })
)
