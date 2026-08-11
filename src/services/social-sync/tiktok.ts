/**
 * TikTok Display API sync.
 *
 * Fetches the AUTHOR's OWN videos using the Display API `video/list` endpoint.
 * The Display API requires a bearer access token obtained via OAuth; we refresh
 * the short-lived access token from the stored `refresh_token` before listing.
 * Returns `[]` (ran=false) when credentials are absent.
 *
 * Requires:
 *   - TIKTOK_CLIENT_KEY
 *   - TIKTOK_CLIENT_SECRET
 *   - TIKTOK_REFRESH_TOKEN
 *   - TIKTOK_OPEN_ID   (the author's open_id)
 *
 * Uses native fetch only (Workers runtime, no Node-only deps).
 */

import { env } from '@/lib/env'
import type { NormalizedSocialPost, PlatformSyncResult } from './types'

const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface VideoItem {
  id: string
  video_description?: string
  share_url?: string
  cover_image_url?: string
  create_time?: number
  duration?: number
}

interface VideoListResponse {
  data?: { videos?: VideoItem[] }
  error?: { message?: string }
}

async function refreshAccessToken(): Promise<string | null> {
  const clientKey = env.TIKTOK_CLIENT_KEY
  const clientSecret = env.TIKTOK_CLIENT_SECRET
  const refreshToken = env.TIKTOK_REFRESH_TOKEN
  if (!clientKey || !clientSecret || !refreshToken) return null

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = (await res.json()) as TokenResponse
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || `TikTok token error ${res.status}`)
  }
  return json.access_token
}

export async function syncTikTok(): Promise<PlatformSyncResult> {
  const openId = env.TIKTOK_OPEN_ID
  if (!openId) {
    return { source: 'tiktok', posts: [], ran: false }
  }

  try {
    const accessToken = await refreshAccessToken()
    if (!accessToken) {
      return { source: 'tiktok', posts: [], ran: false }
    }

    const res = await fetch(VIDEO_LIST_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ filters: { user_id: openId }, max_count: 10 }),
    })
    const json = (await res.json()) as VideoListResponse
    if (!res.ok || json.error) {
      return {
        source: 'tiktok',
        posts: [],
        ran: true,
        error: json.error?.message || `TikTok video/list error ${res.status}`,
      }
    }

    const posts: NormalizedSocialPost[] = (json.data?.videos ?? []).map((item) => {
      const description = item.video_description || 'فيديو تيك توك'
      return {
        externalId: `tt_${item.id}`,
        platform: 'tiktok',
        syncSource: 'tiktok',
        url: item.share_url || `https://www.tiktok.com/@${openId}/video/${item.id}`,
        thumbnail: item.cover_image_url,
        title: description.slice(0, 140),
        caption: description.length > 140 ? description : undefined,
        postDate: item.create_time
          ? new Date(item.create_time * 1000).toISOString()
          : new Date().toISOString(),
      }
    })

    return { source: 'tiktok', posts, ran: true }
  } catch (err) {
    return {
      source: 'tiktok',
      posts: [],
      ran: true,
      error: err instanceof Error ? err.message : 'tiktok sync failed',
    }
  }
}
