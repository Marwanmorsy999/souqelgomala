/**
 * Drizzle schema: Promo Slots (content management)
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export type PromoPlacement =
  | 'hero'
  | 'deals_strip'
  | 'homepage_cta'
  | 'category_banner'
  | 'popup'
  | 'offers_banner'

export const promoSlots = sqliteTable(
  'promo_slots',
  {
    id: text('id').primaryKey(),
    placement: text('placement').$type<PromoPlacement>().notNull(),
    category_id: text('category_id'),
    image_url: text('image_url').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    cta_text: text('cta_text'),
    cta_link: text('cta_link'),
    start_at: text('start_at').notNull(),
    end_at: text('end_at').notNull(),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    sort_order: integer('sort_order').notNull().default(0),
    publish_status: text('publish_status').notNull().default('published'), // 'draft' | 'published'
    frequency: text('frequency').notNull().default('every_visit'), // 'once_per_session' | 'every_visit'
    created_by: text('created_by'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_promo_placement: index('idx_promo_placement').on(table.placement),
    idx_promo_active: index('idx_promo_active').on(table.active),
    idx_promo_dates: index('idx_promo_dates').on(table.start_at, table.end_at),
    idx_promo_category: index('idx_promo_category').on(table.category_id),
  })
)
