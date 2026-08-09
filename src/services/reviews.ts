/**
 * Reviews service — social-proof storefront content.
 *
 * Customers submit reviews from the storefront (public, unauthenticated). A
 * review is `pending` until an admin approves it; only `approved` reviews are
 * returned to the public storefront. The storefront section hides itself when
 * there are zero approved reviews, so no demo / fake content is ever shipped.
 *
 * Tables are guaranteed to exist at runtime via `ensureReviewsTable()` so the
 * feature works on a freshly deployed D1 instance without a manual migration
 * step (the CREATE statement is also present in the 0000 migration for
 * `wrangler d1 migrations apply`).
 */

import { getDb } from '@/db'
import { reviews } from '@/db/schema/reviews'
import type { ReviewStatus } from '@/db/schema/reviews'
import type { User } from '@/services/auth'
import { eq, desc, and, isNull, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY NOT NULL,
  author_name text NOT NULL,
  author_role text,
  rating integer DEFAULT 5 NOT NULL,
  text text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  product_id text,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  moderated_at text,
  moderated_by text,
  rejection_reason text,
  deleted_at text
);`

let ensured = false
async function ensureReviewsTable(): Promise<void> {
  if (ensured) return
  await getDb().run(sql.raw(CREATE_SQL))
  ensured = true
}

export interface PublicReview {
  id: string
  name: string
  role: string
  text: string
  rating: number
  createdAt: string
}

export async function listApprovedReviews(limit = 12): Promise<PublicReview[]> {
  await ensureReviewsTable()
  const rows = await getDb()
    .select()
    .from(reviews)
    .where(and(eq(reviews.status, 'approved'), isNull(reviews.deleted_at)))
    .orderBy(desc(reviews.created_at))
    .limit(limit)
  return rows.map((r) => ({
    id: r.id,
    name: r.author_name,
    role: r.author_role ?? 'سوق الجملة',
    text: r.text,
    rating: r.rating,
    createdAt: r.created_at,
  }))
}

export interface SubmitReviewInput {
  authorName: string
  authorRole?: string
  rating?: number
  text: string
}

export async function submitReview(input: SubmitReviewInput) {
  await ensureReviewsTable()
  const ts = new Date().toISOString()
  const rating = Math.min(5, Math.max(1, input.rating ?? 5))
  const [row] = await getDb()
    .insert(reviews)
    .values({
      id: nanoid(16),
      author_name: input.authorName,
      author_role: input.authorRole ?? null,
      rating,
      text: input.text,
      status: 'pending',
      created_at: ts,
      updated_at: ts,
    })
    .returning()
  return row
}

// --- Admin moderation (RBAC enforced by caller) ---

export async function listAllReviews(): Promise<(typeof reviews.$inferSelect)[]> {
  await ensureReviewsTable()
  return getDb()
    .select()
    .from(reviews)
    .where(isNull(reviews.deleted_at))
    .orderBy(desc(reviews.created_at))
}

export async function moderateReview(
  user: User,
  id: string,
  action: 'approve' | 'reject',
  reason?: string,
) {
  await ensureReviewsTable()
  const existing = await getDb().select().from(reviews).where(eq(reviews.id, id)).limit(1)
  if (!existing[0]) throw new Error('التقييم غير موجود')
  const ts = new Date().toISOString()
  const status: ReviewStatus = action === 'approve' ? 'approved' : 'rejected'
  await getDb()
    .update(reviews)
    .set({
      status,
      moderated_at: ts,
      moderated_by: user.id,
      rejection_reason: action === 'reject' ? (reason ?? null) : null,
      updated_at: ts,
    })
    .where(eq(reviews.id, id))
  return { success: true }
}

export async function deleteReview(user: User, id: string) {
  await ensureReviewsTable()
  const existing = await getDb().select().from(reviews).where(eq(reviews.id, id)).limit(1)
  if (!existing[0]) throw new Error('التقييم غير موجود')
  await getDb()
    .update(reviews)
    .set({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .where(eq(reviews.id, id))
  return { success: true }
}
