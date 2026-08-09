/**
 * Drizzle schema: Orders (Heart of the System)
 *
 * orders, order_items, order_status_history, order_timeline
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type OrderSource = 'website' | 'mobile' | 'admin' | 'whatsapp' | 'facebook'
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    order_number: text('order_number').notNull().unique(), // SG-YYYYMMDD-000001
    customer_id: text('customer_id'),
    customer_name: text('customer_name'),
    customer_phone: text('customer_phone'),
    customer_address: text('customer_address'),
    branch_id: text('branch_id'),
    status: text('status').$type<OrderStatus>().notNull().default('new'),
    source: text('source').$type<OrderSource>().notNull().default('admin'),
    payment_status: text('payment_status').$type<PaymentStatus>().notNull().default('pending'),
    payment_method: text('payment_method').$type<PaymentMethod>(),
    subtotal: real('subtotal').notNull().default(0),
    discount: real('discount').notNull().default(0),
    delivery_fee: real('delivery_fee').notNull().default(0),
    total: real('total').notNull().default(0),
    driver_id: text('driver_id'),
    assigned_driver_name: text('assigned_driver_name'),
    notes: text('notes'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_orders_status: index('idx_orders_status').on(table.status),
    idx_orders_created: index('idx_orders_created').on(table.created_at),
    idx_orders_customer: index('idx_orders_customer').on(table.customer_id),
    idx_orders_driver: index('idx_orders_driver').on(table.driver_id),
    idx_orders_branch: index('idx_orders_branch').on(table.branch_id),
    idx_orders_order_number: index('idx_orders_order_number').on(table.order_number),
    idx_orders_updated: index('idx_orders_updated').on(table.updated_at),
    idx_orders_source: index('idx_orders_source').on(table.source),
    idx_orders_payment_status: index('idx_orders_payment_status').on(table.payment_status),
  })
)

export const orderItems = sqliteTable(
  'order_items',
  {
    id: text('id').primaryKey(),
    order_id: text('order_id').notNull(),
    product_id: text('product_id'),
    name_ar: text('name_ar').notNull(),
    name_en: text('name_en'),
    quantity: integer('quantity').notNull(),
    unit_price: real('unit_price').notNull(),
    total: real('total').notNull(),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_order_items_order: index('idx_order_items_order').on(table.order_id),
    idx_order_items_product: index('idx_order_items_product').on(table.product_id),
  })
)

export const orderStatusHistory = sqliteTable(
  'order_status_history',
  {
    id: text('id').primaryKey(),
    order_id: text('order_id').notNull(),
    from_status: text('from_status').$type<OrderStatus | null>().$type<OrderStatus | null>(), // nullable
    to_status: text('to_status').$type<OrderStatus>().notNull(),
    changed_by: text('changed_by'),
    note: text('note'),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_order_history_order: index('idx_order_history_order').on(table.order_id, table.created_at),
  })
)

export const orderTimeline = sqliteTable(
  'order_timeline',
  {
    id: text('id').primaryKey(),
    order_id: text('order_id').notNull(),
    type: text('type').notNull(), // status_change, note, driver_assigned, payment, etc.
    note: text('note'),
    actor_id: text('actor_id'),
    metadata: text('metadata'), // JSON
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_order_timeline_order: index('idx_order_timeline_order').on(table.order_id, table.created_at),
  })
)
