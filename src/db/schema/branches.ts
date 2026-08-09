/**
 * Drizzle schema: Branches
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export const branches = sqliteTable(
  'branches',
  {
    id: text('id').primaryKey(),
    name_ar: text('name_ar').notNull(),
    name_en: text('name_en'),
    code: text('code'),
    address: text('address'),
    phone: text('phone'),
    working_hours: text('working_hours'), // JSON: {"saturday": {"open": "09:00", "close": "23:00"}, ...}
    latitude: real('latitude'),
    longitude: real('longitude'),
    google_maps_url: text('google_maps_url'),
    manager_id: text('manager_id'), // FK → profiles.id
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_branches_code: index('idx_branches_code').on(table.code),
    idx_branches_active: index('idx_branches_active').on(table.is_active),
  })
)
