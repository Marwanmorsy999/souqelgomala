/**
 * Facebook Graph API sync.
 *
 * Fetches the business PAGE's own feed + photos using a long-lived Page access
 * token. Returns `[]` (ran=false) when credentials are absent so a partially
 * configured deployment never breaks the overall sync.
 *
 * Requires:
 *   - META_ACCESS_TOKEN  (long-lived Page token with pages_read_engagement)
 *   - META_PAGE_ID       (the business Page id)
 *
 * Uses native fetch only (Workers runtime, no Node-only deps).
 */

import { env } from '@/lib/env'
import type { NormalizedSocialPost, PlatformSyncResult } from './types'

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

interface GraphFeedItem {
  id: string
  message?: string
  caption?: string
  description?: string
  link?: string
  permalink_url?: string
  created_time?: string
  full_picture?: string
  picture?: string
  type?: string
}

interface GraphResponse {
  data?: GraphFeedItem[]
  error?: { message?: string }
}

function toIso(facebookTime?: string): string {
  if (!facebookTime) return new Date().toISOString()
  const d = new Date(facebookTime)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export async function syncFacebook(): Promise<PlatformSyncResult> {
  const token = env.META_ACCESS_TOKEN
  const pageId = env.META_PAGE_ID
  if (!token || !pageId) {
    return { source: 'facebook', posts: [], ran: false }
  }

  try {
    const url =
      `${GRAPH_BASE}/${encodeURIComponent(pageId)}/feed` +
      `?fields=id,message,caption,description,link,permalink_url,created_time,full_picture,picture,type` +
      `&limit=10&access_token=${encodeURIComponent(token)}`

    const res = await fetch(url, { headers: { accept: 'application/json' } })
    const json = (await res.json()) as GraphResponse
    if (!res.ok || json.error) {
      return {
        source: 'facebook',
        posts: [],
        ran: true,
        error: json.error?.message || `Facebook Graph error ${res.status}`,
      }
    }

    const posts: NormalizedSocialPost[] = (json.data ?? []).map((item) => {
      const title = item.message || item.caption || item.description || 'منشور فيسبوك'
      const thumbnail = item.full_picture || item.picture
      return {
        externalId: `fb_${item.id}`,
        platform: 'facebook',
        syncSource: 'facebook',
        url: item.permalink_url || item.link || `https://facebook.com/${item.id}`,
        thumbnail,
        title: title.slice(0, 140),
        caption: title.length > 140 ? title : undefined,
        postDate: toIso(item.created_time),
      }
    })

    return { source: 'facebook', posts, ran: true }
  } catch (err) {
    return {
      source: 'facebook',
      posts: [],
      ran: true,
      error: err instanceof Error ? err.message : 'facebook sync failed',
    }
  }
}
