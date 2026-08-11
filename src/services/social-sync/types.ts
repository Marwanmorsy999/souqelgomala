/**
 * Types for the social auto-sync layer.
 *
 * Each platform's sync function fetches the account owner's OWN media from the
 * official API and normalizes it into `NormalizedSocialPost`. The repository
 * upserts these into the `social_posts` D1 table keyed by `external_id`.
 */

import type { SocialPlatform } from '@/db/schema/social'

/** Source system that produced a synced post. */
export type SyncSource = 'facebook' | 'instagram' | 'tiktok'

export interface NormalizedSocialPost {
  /** Platform-scoped stable id (e.g. IG media id, FB post id, TikTok video id). */
  externalId: string
  platform: SocialPlatform
  syncSource: SyncSource
  url: string
  thumbnail?: string
  title: string
  caption?: string
  /** ISO 8601 publish date. */
  postDate: string
}

export interface PlatformSyncResult {
  source: SyncSource
  posts: NormalizedSocialPost[]
  /** True when credentials were present and the sync ran. */
  ran: boolean
  /** Populated when the platform errored (non-fatal to the whole sync). */
  error?: string
}
