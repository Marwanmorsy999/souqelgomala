/**
 * Drizzle schema: Import Jobs (bulk data tracking)
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export type ImportType = 'excel' | 'csv' | 'pdf'
export type ImportStatus = 'pending' | 'validated' | 'committed' | 'failed'

export const importJobs = sqliteTable(
  'import_jobs',
  {
    id: text('id').primaryKey(),
    type: text('type').$type<ImportType>().notNull(),
    filename: text('filename').notNull(),
    status: text('status').$type<ImportStatus>().notNull().default('pending'),
    row_count: integer('row_count').notNull().default(0),
    error_count: integer('error_count').notNull().default(0),
    error_log: text('error_log'), // JSON
    uploaded_by: text('uploaded_by'),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_import_status: index('idx_import_status').on(table.status),
    idx_import_created: index('idx_import_created').on(table.created_at),
  })
)
