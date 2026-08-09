/**
 * Drizzle schema: Inventory Movements
 *
 * Immutable ledger of stock changes. Replaces the PostgreSQL trigger-based
 * approach; the repository/service layer is responsible for creating
 * movements on every stock-affecting operation.
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export type MovementType =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out'
  | 'initial_stock'

export const inventoryMovements = sqliteTable(
  'inventory_movements',
  {
    id: text('id').primaryKey(),
    product_id: text('product_id').notNull(),
    movement_type: text('movement_type').$type<MovementType>().notNull(),
    quantity: integer('quantity').notNull(),
    reason: text('reason'),
    reference_type: text('reference_type'), // 'order', 'purchase_order', 'return', 'adjustment'
    reference_id: text('reference_id'),
    created_by: text('created_by'),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_inventory_movements_product: index('idx_inventory_movements_product').on(table.product_id),
    idx_inventory_movements_type: index('idx_inventory_movements_type').on(table.movement_type),
    idx_inventory_movements_created: index('idx_inventory_movements_created').on(table.created_at),
    idx_inventory_movements_ref: index('idx_inventory_movements_ref').on(table.reference_type, table.reference_id),
  })
)
