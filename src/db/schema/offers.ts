/**
 * Drizzle schema: Offers & Promotions
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export type DiscountType = 'percentage' | 'fixed_price' | 'buy_x_get_y'
export type OfferStatus = 'active' | 'inactive' | 'scheduled' | 'expired'

export const offers = sqliteTable(
  'offers',
  {
    id: text('id').primaryKey(),
    banner: text('banner'), // R2 object key
    campaign_name: text('campaign_name').notNull(),
    discount_type: text('discount_type').$type<DiscountType>().notNull(),
    value: real('value'), // percentage or fixed amount
    buy_x: integer('buy_x'), // buy X get Y
    get_y: integer('get_y'), // buy X get Y
    product_ids: text('product_ids').notNull().default('[]'), // JSON array of product UUIDs
    start_date: text('start_date').notNull(),
    end_date: text('end_date').notNull(),
    status: text('status').$type<OfferStatus>().notNull().default('scheduled'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_offers_status: index('idx_offers_status').on(table.status),
    idx_offers_dates: index('idx_offers_dates').on(table.start_date, table.end_date),
    idx_offers_active: index('idx_offers_active').on(table.id),
  })
)
