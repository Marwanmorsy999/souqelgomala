/**
 * Drizzle schema: Customer Reviews (social proof).
 *
 * Reviews power the storefront "عملاء سوق الجملة" section. Customers submit
 * reviews from the storefront; an admin moderates them (approve / reject /
 * delete) before they become publicly visible. Unverified / demo data is never
 * shipped — the storefront section hides itself when there are no approved reviews.
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export const reviews = sqliteTable(
  'reviews',
  {
    id: text('id').primaryKey(),
    author_name: text('author_name').notNull(),
    author_role: text('author_role'),
    rating: integer('rating').notNull().default(5),
    text: text('text').notNull(),
    status: text('status').$type<ReviewStatus>().notNull().default('pending'),
    product_id: text('product_id'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    moderated_at: text('moderated_at'),
    moderated_by: text('moderated_by'),
    rejection_reason: text('rejection_reason'),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_reviews_status: index('idx_reviews_status').on(table.status),
    idx_reviews_product: index('idx_reviews_product').on(table.product_id),
    idx_reviews_created: index('idx_reviews_created').on(table.created_at),
  })
)

export type ReviewRow = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert
