/**
 * Social sync orchestrator.
 *
 * Runs the Facebook, Instagram, and TikTok sync functions in parallel, merges
 * the results, and upserts them into D1. Each platform short-circuits to an
 * empty list when its credentials are absent, so a partially-configured
 * deployment never errors. This is the single entry point used by both the
 * cron `scheduled` handler and the manual admin "Sync now" action.
 */

import { logger } from '@/lib/logger'
import { upsertSyncedPosts } from './repository'
import { syncFacebook } from './facebook'
import { syncInstagram } from './instagram'
import { syncTikTok } from './tiktok'
import type {
  NormalizedSocialPost,
  PlatformSyncResult,
  SyncSource,
} from './types'

export interface SyncAllResult {
  ran: SyncSource[]
  skipped: SyncSource[]
  total: number
  inserted: number
  updated: number
  skippedRows: number
  errors: Partial<Record<SyncSource, string>>
}

/**
 * Run all platform syncs and persist the results.
 * Always resolves (never throws) so the cron handler stays resilient.
 */
export async function syncAllSocial(): Promise<SyncAllResult> {
  const results: PlatformSyncResult[] = await Promise.all([
    syncFacebook(),
    syncInstagram(),
    syncTikTok(),
  ])

  const all: NormalizedSocialPost[] = results.flatMap((r) => r.posts)
  const upsert = await upsertSyncedPosts(all).catch((err) => {
    logger.error('Social sync: upsert failed', { error: err })
    return { inserted: 0, updated: 0, skipped: 0 }
  })

  const errors: Partial<Record<SyncSource, string>> = {}
  for (const r of results) {
    if (r.error) errors[r.source] = r.error
  }

  return {
    ran: results.filter((r) => r.ran).map((r) => r.source),
    skipped: results.filter((r) => !r.ran).map((r) => r.source),
    total: all.length,
    inserted: upsert.inserted,
    updated: upsert.updated,
    skippedRows: upsert.skipped,
    errors,
  }
}
