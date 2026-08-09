/**
 * Drizzle schema: Suppliers & Purchase Orders
 *
 * Foundation modules — feature-flagged. These tables are seeded with the
 * proper schema but data entry UI is gated behind feature flags.
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled'

export const suppliers = sqliteTable(
  'suppliers',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    tax_id: text('tax_id'),
    payment_terms: text('payment_terms'),
    notes: text('notes'),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_suppliers_name: index('idx_suppliers_name').on(table.name),
    idx_suppliers_active: index('idx_suppliers_active').on(table.is_active),
    idx_suppliers_tax_id: index('idx_suppliers_tax_id').on(table.tax_id),
  })
)

export const purchaseOrders = sqliteTable(
  'purchase_orders',
  {
    id: text('id').primaryKey(),
    po_number: text('po_number').notNull().unique(),
    supplier_id: text('supplier_id'),
    status: text('status').$type<PurchaseOrderStatus>().notNull().default('draft'),
    expected_date: text('expected_date'),
    received_date: text('received_date'),
    subtotal: real('subtotal').notNull().default(0),
    tax: real('tax').notNull().default(0),
    discount: real('discount').notNull().default(0),
    total: real('total').notNull().default(0),
    notes: text('notes'),
    created_by: text('created_by'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_purchase_orders_supplier: index('idx_purchase_orders_supplier').on(table.supplier_id),
    idx_purchase_orders_status: index('idx_purchase_orders_status').on(table.status),
    idx_purchase_orders_po_number: index('idx_purchase_orders_po_number').on(table.po_number),
  })
)

export const purchaseOrderItems = sqliteTable(
  'purchase_order_items',
  {
    id: text('id').primaryKey(),
    purchase_order_id: text('purchase_order_id').notNull(),
    product_id: text('product_id'),
    quantity: integer('quantity').notNull(),
    unit_cost: real('unit_cost').notNull(),
    total: real('total').notNull(),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_purchase_order_items_po: index('idx_purchase_order_items_po').on(table.purchase_order_id),
    idx_purchase_order_items_product: index('idx_purchase_order_items_product').on(table.product_id),
  })
)
