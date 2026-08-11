/**
 * Drizzle schema: Deal History (audit + reporting)
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export const dealHistory = sqliteTable(
  'deal_history',
  {
    id: text('id').primaryKey(),
    product_id: text('product_id').notNull(),
    discount_pct: integer('discount_pct'),
    fixed_discount: real('fixed_discount'),
    start_at: text('start_at').notNull(),
    end_at: text('end_at').notNull(),
    created_by: text('created_by'),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_deal_product: index('idx_deal_product').on(table.product_id),
    idx_deal_dates: index('idx_deal_dates').on(table.start_at, table.end_at),
  })
)
