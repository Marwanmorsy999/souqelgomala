/**
 * Drizzle schema: Customers & Customer Addresses
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export const customers = sqliteTable(
  'customers',
  {
    id: text('id').primaryKey(),
    phone: text('phone').notNull(),
    name: text('name'),
    email: text('email'),
    total_spending: real('total_spending').notNull().default(0),
    average_order: real('average_order').notNull().default(0),
    order_count: integer('order_count').notNull().default(0),
    is_vip: integer('is_vip', { mode: 'boolean' }).notNull().default(false),
    is_blacklisted: integer('is_blacklisted', { mode: 'boolean' }).notNull().default(false),
    notes: text('notes'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_customers_phone: index('idx_customers_phone').on(table.phone),
    idx_customers_vip: index('idx_customers_vip').on(table.is_vip),
    idx_customers_total_spending: index('idx_customers_total_spending').on(table.total_spending),
  })
)

export const customerAddresses = sqliteTable(
  'customer_addresses',
  {
    id: text('id').primaryKey(),
    customer_id: text('customer_id').notNull(),
    label: text('label'),
    city: text('city').notNull(),
    address: text('address').notNull(),
    latitude: real('latitude'),
    longitude: real('longitude'),
    is_default: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_customer_addresses_customer: index('idx_customer_addresses_customer').on(table.customer_id),
    idx_customer_addresses_default: index('idx_customer_addresses_default').on(table.is_default),
  })
)
