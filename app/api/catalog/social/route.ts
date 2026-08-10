import { NextRequest } from 'next/server'
import { ok, serverError } from '@/services/api-response'
import { getPublicSocialPosts } from '@/services/social'
import {
  kvGetJSON,
  kvPutJSON,
  CACHE_KEYS,
} from '@/lib/cloudflare/kv'

export const dynamic = 'force-dynamic'

/**
 * Public catalog social feed.
 *
 * GET /api/catalog/social
 *
 * Returns admin-managed, visible social posts (real post URLs + thumbnails).
 * No scraping and no fake feed — if the admin hasn't added posts yet the
 * response is an empty array so the storefront renders an honest state.
 * KV-cached; the admin social service invalidates the cache on every write.
 */
export async function GET(_request: NextRequest) {
  try {
    const cacheKey = CACHE_KEYS.SOCIAL
    const cached = await kvGetJSON(cacheKey)
    if (cached && Array.isArray(cached)) {
      return ok(cached)
    }
    const posts = await getPublicSocialPosts(12)
    await kvPutJSON(cacheKey, posts, { ttl: 120 })
    return ok(posts)
  } catch (err) {
    console.error('Catalog social error', err)
    return serverError('فشل تحميل المنشورات')
  }
}