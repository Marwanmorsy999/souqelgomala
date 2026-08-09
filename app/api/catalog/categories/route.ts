import { NextRequest } from 'next/server'
import { getCategories } from '@/services/catalog/service'
import { ok, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

/**
 * Public catalog categories endpoint.
 *
 * GET /api/catalog/categories
 *
 * Returns active, visible categories mapped to storefront shape (with Cloudinary
 * thumbnails). Reads go through the catalog service (D1 source of truth + KV cache).
 */
export async function GET() {
  try {
    const categories = await getCategories()
    return ok(categories)
  } catch (err) {
    console.error('Catalog categories error', err)
    return serverError('فشل تحميل الأقسام')
  }
}
