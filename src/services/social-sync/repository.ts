/**
 * Social sync repository — idempotent upsert of synced posts into D1.
 *
 * Posts are keyed by `external_id` so re-running a sync does not create
 * duplicates. Manual posts (`is_synced = 0`) are NEVER overwritten by a sync:
 * if a row already exists for an `external_id` AND it is a manual post, the
 * sync row is skipped. Manual curation always wins ordering (`featured` stays
 * false for synced posts by default).
 */

import { getDb } from '@/db'
import { socialPosts } from '@/db/schema/social'
import { eq, and, isNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { invalidateCache } from '@/lib/cloudflare/kv'
import { SOCIAL_CACHE_KEY } from '@/services/social'
import { logger } from '@/lib/logger'
import type { NormalizedSocialPost } from './types'

/**
 * Upsert a batch of synced posts.
 * Returns counts of inserted / updated / skipped rows for observability.
 */
export async function upsertSyncedPosts(
  posts: NormalizedSocialPost[],
): Promise<{ inserted: number; updated: number; skipped: number }> {
  if (posts.length === 0) return { inserted: 0, updated: 0, skipped: 0 }

  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const post of posts) {
    const existing = await getDb()
      .select({ id: socialPosts.id, isSynced: socialPosts.is_synced })
      .from(socialPosts)
      .where(eq(socialPosts.external_id, post.externalId))
      .limit(1)

    const row = existing[0]
    // Never overwrite a manual (admin) post that happens to share an id.
    if (row && row.isSynced === false) {
      skipped++
      continue
    }

    const ts = new Date().toISOString()
    const syncOnly = {
      platform: post.platform,
      url: post.url,
      thumbnail: post.thumbnail ?? null,
      title: post.title,
      caption: post.caption ?? null,
      post_date: post.postDate,
      external_id: post.externalId,
      sync_source: post.syncSource,
      is_synced: true,
      updated_at: ts,
    }

    if (row) {
      await getDb()
        .update(socialPosts)
        .set(syncOnly)
        .where(eq(socialPosts.id, row.id))
      updated++
    } else {
      await getDb()
        .insert(socialPosts)
        .values({
          id: nanoid(16),
          ...syncOnly,
          is_visible: true,
          featured: false,
          sort_order: 0,
          created_at: ts,
        })
      inserted++
    }
  }

  await invalidateCache(SOCIAL_CACHE_KEY)
  logger.info('Social sync: upserted', { inserted, updated, skipped })
  return { inserted, updated, skipped }
}
