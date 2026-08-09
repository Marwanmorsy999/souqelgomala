/**
 * Drizzle schema: Returns
 *
 * Foundation module — feature-flagged. Return requests initiated by
 * customers or staff against an order.
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export const returns = sqliteTable(
  'returns',
  {
    id: text('id').primaryKey(),
    return_number: text('return_number').notNull().unique(),
    order_id: text('order_id'),
    customer_id: text('customer_id'),
    status: text('status').$type<ReturnStatus>().notNull().default('pending'),
    reason: text('reason'),
    total_refund: real('total_refund').notNull().default(0),
    created_by: text('created_by'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_returns_order: index('idx_returns_order').on(table.order_id),
    idx_returns_customer: index('idx_returns_customer').on(table.customer_id),
    idx_returns_status: index('idx_returns_status').on(table.status),
    idx_returns_return_number: index('idx_returns_return_number').on(table.return_number),
  })
)

export const returnItems = sqliteTable(
  'return_items',
  {
    id: text('id').primaryKey(),
    return_id: text('return_id').notNull(),
    product_id: text('product_id'),
    quantity: integer('quantity').notNull(),
    unit_price: real('unit_price').notNull(),
    total: real('total').notNull(),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_return_items_return: index('idx_return_items_return').on(table.return_id),
    idx_return_items_product: index('idx_return_items_product').on(table.product_id),
  })
)
