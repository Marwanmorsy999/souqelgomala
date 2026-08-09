/**
 * Drizzle schema: Delivery (drivers, areas, assignments)
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export type DriverStatus = 'available' | 'busy' | 'offline'
export type AssignmentStatus = 'assigned' | 'picked_up' | 'delivered' | 'returned'

export const deliveryDrivers = sqliteTable(
  'delivery_drivers',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    vehicle: text('vehicle'),
    branch_id: text('branch_id'),
    status: text('status').$type<DriverStatus>().notNull().default('available'),
    current_order_id: text('current_order_id'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_delivery_drivers_branch: index('idx_delivery_drivers_branch').on(table.branch_id),
    idx_delivery_drivers_status: index('idx_delivery_drivers_status').on(table.status),
  })
)

export const deliveryAreas = sqliteTable(
  'delivery_areas',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    city: text('city').notNull(),
    fee: real('fee').notNull().default(0),
    min_order: real('min_order').notNull().default(0),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_delivery_areas_city: index('idx_delivery_areas_city').on(table.city),
    idx_delivery_areas_active: index('idx_delivery_areas_active').on(table.is_active),
  })
)

export const deliveryAssignments = sqliteTable(
  'delivery_assignments',
  {
    id: text('id').primaryKey(),
    order_id: text('order_id').notNull(),
    driver_id: text('driver_id'),
    assigned_by: text('assigned_by'),
    status: text('status').$type<AssignmentStatus>().notNull().default('assigned'),
    notes: text('notes'),
    assigned_at: text('assigned_at').notNull(),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_delivery_assignments_order: index('idx_delivery_assignments_order').on(table.order_id),
    idx_delivery_assignments_driver: index('idx_delivery_assignments_driver').on(table.driver_id),
  })
)
