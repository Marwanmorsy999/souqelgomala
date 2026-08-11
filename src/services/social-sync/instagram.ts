/**
 * Instagram Graph API sync.
 *
 * Fetches the business/creator Instagram account's OWN media using the
 * Instagram Graph API. Returns `[]` (ran=false) when credentials are absent.
 *
 * Requires:
 *   - META_ACCESS_TOKEN         (long-lived token with instagram_graph_user_media)
 *   - META_INSTAGRAM_USER_ID    (the IG user/business id)
 *
 * Uses native fetch only (Workers runtime, no Node-only deps).
 */

import { env } from '@/lib/env'
import type { NormalizedSocialPost, PlatformSyncResult } from './types'

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

interface IgMediaItem {
  id: string
  caption?: string
  permalink?: string
  media_url?: string
  thumbnail_url?: string
  timestamp?: string
  media_type?: string
}

interface GraphResponse {
  data?: IgMediaItem[]
  error?: { message?: string }
}

function toIso(timestamp?: string): string {
  if (!timestamp) return new Date().toISOString()
  const d = new Date(timestamp)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export async function syncInstagram(): Promise<PlatformSyncResult> {
  const token = env.META_ACCESS_TOKEN
  const igUserId = env.META_INSTAGRAM_USER_ID
  if (!token || !igUserId) {
    return { source: 'instagram', posts: [], ran: false }
  }

  try {
    const url =
      `${GRAPH_BASE}/${encodeURIComponent(igUserId)}/media` +
      `?fields=id,caption,permalink,media_url,thumbnail_url,timestamp,media_type` +
      `&limit=10&access_token=${encodeURIComponent(token)}`

    const res = await fetch(url, { headers: { accept: 'application/json' } })
    const json = (await res.json()) as GraphResponse
    if (!res.ok || json.error) {
      return {
        source: 'instagram',
        posts: [],
        ran: true,
        error: json.error?.message || `Instagram Graph error ${res.status}`,
      }
    }

    const posts: NormalizedSocialPost[] = (json.data ?? []).map((item) => {
      const caption = item.caption || 'منشور إنستجرام'
      return {
        externalId: `ig_${item.id}`,
        platform: 'instagram',
        syncSource: 'instagram',
        url: item.permalink || `https://instagram.com/p/${item.id}`,
        // Videos expose thumbnail_url; images use media_url.
        thumbnail: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
        title: caption.slice(0, 140),
        caption: caption.length > 140 ? caption : undefined,
        postDate: toIso(item.timestamp),
      }
    })

    return { source: 'instagram', posts, ran: true }
  } catch (err) {
    return {
      source: 'instagram',
      posts: [],
      ran: true,
      error: err instanceof Error ? err.message : 'instagram sync failed',
    }
  }
}
