/**
 * Drizzle schema: Social Posts (admin-managed daily offers content).
 *
 * The business publishes its daily offers on Facebook / Instagram / TikTok.
 * Admins add those real posts (URL, thumbnail, title, date) here; the
 * storefront SocialFeed renders only admin-managed real posts. No scraping,
 * no fake/live-feed simulation. A post may be linked to a daily offer
 * (`linked_offer_id`) so the "عرض النهارده" badge can bridge a social post
 * with the corresponding offers-table campaign.
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const SocialPlatform = ['facebook', 'instagram', 'tiktok', 'whatsapp'] as const
export type SocialPlatform = (typeof SocialPlatform)[number]

export const socialPosts = sqliteTable(
  'social_posts',
  {
    id: text('id').primaryKey(),
    platform: text('platform').$type<SocialPlatform>().notNull(),
    url: text('url').notNull(),
    thumbnail: text('thumbnail'),
    title: text('title').notNull(),
    caption: text('caption'),
    post_date: text('post_date').notNull(),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    linked_offer_id: text('linked_offer_id'), // optional bridge to the offers table
    is_visible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    sort_order: integer('sort_order').notNull().default(0),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_social_posts_visible: index('idx_social_posts_visible').on(table.is_visible),
    idx_social_posts_featured: index('idx_social_posts_featured').on(table.featured),
    idx_social_posts_date: index('idx_social_posts_date').on(table.post_date),
  })
)

export type SocialPostRow = typeof socialPosts.$inferSelect
export type NewSocialPost = typeof socialPosts.$inferInsert