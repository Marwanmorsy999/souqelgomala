/**
 * Drizzle schema: Operations (activity_logs, notifications, settings)
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success'

export const activityLogs = sqliteTable(
  'activity_logs',
  {
    id: text('id').primaryKey(),
    user_id: text('user_id'),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entity_id: text('entity_id'),
    metadata: text('metadata'), // JSON
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_activity_logs_created: index('idx_activity_logs_created').on(table.created_at),
    idx_activity_logs_entity: index('idx_activity_logs_entity').on(table.entity, table.entity_id),
  })
)

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    user_id: text('user_id'), // null = broadcast to all
    type: text('type').notNull(), // low_stock, new_order, cancelled_order, offer_ending, delivery_delay, system
    title: text('title').notNull(),
    body: text('body'),
    severity: text('severity').$type<NotificationSeverity>().notNull().default('info'),
    is_read: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    read_at: text('read_at'),
    entity: text('entity'),
    entity_id: text('entity_id'),
    metadata: text('metadata'), // JSON
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_notifications_user: index('idx_notifications_user').on(table.user_id),
    idx_notifications_read_at: index('idx_notifications_read_at').on(table.read_at, table.created_at),
    idx_notifications_created: index('idx_notifications_created').on(table.created_at),
  })
)

export const settings = sqliteTable(
  'settings',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    value: text('value').notNull(), // JSON
    description: text('description'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_settings_key: index('idx_settings_key').on(table.key),
  })
)
