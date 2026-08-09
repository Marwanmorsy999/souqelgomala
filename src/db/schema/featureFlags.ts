/**
 * Drizzle schema: Feature Flags & Groups
 *
 * Allows runtime toggling of modules without deployments. Feature flags are
 * cached in KV for fast read access and are checked at the service layer
 * before any business operation.
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const featureGroups = sqliteTable(
  'feature_groups',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    sort_order: integer('sort_order').notNull().default(0),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_feature_groups_active: index('idx_feature_groups_active').on(table.is_active),
  })
)

export const featureFlags = sqliteTable(
  'feature_flags',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(), // e.g. 'inventory', 'suppliers'
    group_id: text('group_id'),
    label: text('label').notNull(),
    description: text('description'),
    is_enabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(false),
    value: text('value'), // JSON — arbitrary flag config
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_feature_flags_key: index('idx_feature_flags_key').on(table.key),
    idx_feature_flags_enabled: index('idx_feature_flags_enabled').on(table.is_enabled),
  })
)
