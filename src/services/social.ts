/**
 * Social posts service — admin-managed + auto-synced real social content.
 *
 * The business publishes its daily offers on Facebook / Instagram / TikTok.
 * Admins add the real post URL + thumbnail + caption here, and the storefront
 * SocialFeed renders these admin-managed posts first. Posts can ALSO be
 * auto-synced from the official Meta Graph + TikTok Display APIs (see
 * src/services/social-sync): synced rows carry `external_id` / `sync_source`
 * / `is_synced` and never overwrite manual rows. A post may be flagged
 * `featured` ("عرض النهارده") and optionally linked to an existing offer
 * campaign (`linked_offer_id`) so the badge can bridge to the daily offers
 * section without duplicating data entry.
 *
 * The table is guaranteed to exist at runtime (same pattern as orders/reviews)
 * and is also present in the 0003 migration + 0007 sync migration for
 * `wrangler d1 migrations apply`.
 */

import { getDb } from '@/db'
import { socialPosts, type SocialPlatform } from '@/db/schema/social'
import { offers } from '@/db/schema/offers'
import type { User } from '@/services/auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { eq, and, desc, isNull, inArray, sql, asc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { invalidateCache } from '@/lib/cloudflare/kv'
import { logger } from '@/lib/logger'

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS social_posts (
  id text PRIMARY KEY NOT NULL,
  platform text NOT NULL,
  url text NOT NULL,
  thumbnail text,
  title text NOT NULL,
  caption text,
  post_date text NOT NULL,
  featured integer DEFAULT false NOT NULL,
  linked_offer_id text,
  is_visible integer DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  deleted_at text
);
CREATE INDEX IF NOT EXISTS idx_social_posts_visible ON social_posts (is_visible);
CREATE INDEX IF NOT EXISTS idx_social_posts_featured ON social_posts (featured);
CREATE INDEX IF NOT EXISTS idx_social_posts_date ON social_posts (post_date);`

/** KV cache key for the public social feed. */
export const SOCIAL_CACHE_KEY = 'catalog:social'

let ensured = false
async function ensureSocialTable(): Promise<void> {
  if (ensured) return
  await getDb().run(sql.raw(CREATE_SQL))
  await ensureSyncColumns()
  ensured = true
}

/**
 * Idempotently add the auto-sync columns. SQLite has no `ADD COLUMN IF NOT
 * EXISTS`, so on a fresh DB the migration (0007) or this block adds them once;
 * on subsequent cold starts the ALTERs throw "duplicate column", which we
 * swallow. Never throws for an already-migrated table.
 */
async function ensureSyncColumns(): Promise<void> {
  const alters = [
    `ALTER TABLE social_posts ADD COLUMN external_id text`,
    `ALTER TABLE social_posts ADD COLUMN sync_source text`,
    `ALTER TABLE social_posts ADD COLUMN is_synced integer NOT NULL DEFAULT false`,
  ]
  for (const stmt of alters) {
    try {
      await getDb().run(sql.raw(stmt))
    } catch (err) {
      const msg = (err as Error)?.message ?? ''
      // Ignore "duplicate column" — columns already exist from a prior run.
      if (!/duplicate column/i.test(msg)) {
        logger.warn('Social: ensureSyncColumns unexpected error', { error: msg })
      }
    }
  }
  try {
    await getDb().run(sql.raw(`CREATE INDEX IF NOT EXISTS idx_social_posts_external ON social_posts (external_id)`))
  } catch {
    /* index already exists */
  }
}

export class SocialError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'SocialError'
  }
}

export function assertCanWriteSocial(user: User): void {
  if (!hasPermission(user.role as Role, 'social.write')) {
    throw new SocialError('ليس لديك صلاحية لإدارة منشورات السوشيال ميديا', 403)
  }
}

function now(): string {
  return new Date().toISOString()
}

/** Storefront SocialPost shape (mirrors lib/types.ts `SocialPost`). */
export interface PublicSocialPost {
  id: string
  platform: SocialPlatform
  url: string
  thumbnail?: string
  title: string
  caption?: string
  date: string
  featured?: boolean
  linkedOfferId?: string
}

function toPublic(row: (typeof socialPosts.$inferSelect)): PublicSocialPost {
  return {
    id: row.id,
    platform: row.platform,
    url: row.url,
    thumbnail: row.thumbnail ?? undefined,
    title: row.title,
    caption: row.caption ?? undefined,
    date: row.post_date,
    featured: row.featured,
    linkedOfferId: row.linked_offer_id ?? undefined,
  }
}

// ============================================
// ADMIN
// ============================================

/** Every post for the admin table (including hidden). */
export async function listSocialPostsAdmin() {
  await ensureSocialTable()
  const rows = await getDb()
    .select()
    .from(socialPosts)
    .where(isNull(socialPosts.deleted_at))
    .orderBy(desc(socialPosts.created_at))

  // Resolve linked offer titles so the admin table can show the bridge.
  const offerIds = [...new Set(rows.map((r) => r.linked_offer_id).filter(Boolean) as string[])]
  let offerTitles = new Map<string, string>()
  if (offerIds.length) {
    const offerRows = await getDb()
      .select({ id: offers.id, campaign_name: offers.campaign_name })
      .from(offers)
      .where(inArray(offers.id, offerIds))
    offerTitles = new Map(offerRows.map((o) => [o.id, o.campaign_name]))
  }

  return rows.map((r) => ({
    ...r,
    linkedOfferTitle: r.linked_offer_id ? (offerTitles.get(r.linked_offer_id) ?? null) : null,
  }))
}

export interface CreateSocialPostInput {
  platform: SocialPlatform
  url: string
  thumbnail?: string
  title: string
  caption?: string
  postDate: string
  featured?: boolean
  linkedOfferId?: string | null
  isVisible?: boolean
  sortOrder?: number
}

export async function createSocialPost(user: User, input: CreateSocialPostInput) {
  assertCanWriteSocial(user)
  const ts = now()
  const [row] = await getDb()
    .insert(socialPosts)
    .values({
      id: nanoid(16),
      platform: input.platform,
      url: input.url,
      thumbnail: input.thumbnail?.trim() ? input.thumbnail.trim() : null,
      title: input.title,
      caption: input.caption?.trim() ? input.caption.trim() : null,
      post_date: input.postDate || ts,
      featured: input.featured ?? false,
      linked_offer_id: input.linkedOfferId ?? null,
      is_visible: input.isVisible ?? true,
      sort_order: input.sortOrder ?? 0,
      created_at: ts,
      updated_at: ts,
    })
    .returning()
  await invalidateCache(SOCIAL_CACHE_KEY)
  logger.info('Social: post created', { id: row.id, by: user.id })
  return row
}
// ============================================
// PUBLIC (storefront)
export async function updateSocialPost(
  user: User,
  id: string,
  input: Partial<CreateSocialPostInput>,
) {
  assertCanWriteSocial(user)
  const existing = await getDb().select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1)
  if (!existing[0]) throw new SocialError('المنشور غير موجود', 404)

  await getDb()
    .update(socialPosts)
    .set({
      ...(input.platform !== undefined ? { platform: input.platform } : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.thumbnail !== undefined ? { thumbnail: input.thumbnail.trim() ? input.thumbnail.trim() : null } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.caption !== undefined ? { caption: input.caption.trim() ? input.caption.trim() : null } : {}),
      ...(input.postDate !== undefined ? { post_date: input.postDate } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.linkedOfferId !== undefined ? { linked_offer_id: input.linkedOfferId ?? null } : {}),
      ...(input.isVisible !== undefined ? { is_visible: input.isVisible } : {}),
      ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
      updated_at: now(),
    })
    .where(eq(socialPosts.id, id))
  await invalidateCache(SOCIAL_CACHE_KEY)
  logger.info('Social: post updated', { id, by: user.id })
  return { success: true }
}

/** Soft-delete a social post. */
export async function softDeleteSocialPost(user: User, id: string) {
  assertCanWriteSocial(user)
  const existing = await getDb().select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1)
  if (!existing[0]) throw new SocialError('المنشور غير موجود', 404)
  await getDb()
    .update(socialPosts)
    .set({ deleted_at: now(), updated_at: now(), is_visible: false })
    .where(eq(socialPosts.id, id))
  await invalidateCache(SOCIAL_CACHE_KEY)
  logger.info('Social: post deleted', { id, by: user.id })
  return { success: true }
}
// ============================================

/** Active, visible posts for the storefront feed (featured first). */
export async function getPublicSocialPosts(limit = 12): Promise<PublicSocialPost[]> {
  await ensureSocialTable()
  const rows = await getDb()
    .select()
    .from(socialPosts)
    .where(and(eq(socialPosts.is_visible, true), isNull(socialPosts.deleted_at)))
    .orderBy(desc(socialPosts.featured), asc(socialPosts.sort_order), desc(socialPosts.post_date))
    .limit(limit)
  return rows.map(toPublic)
}