import { NextRequest } from 'next/server'
import { getDailyOffers } from '@/services/catalog/service'
import { ok, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

/**
 * Public catalog daily-offers endpoint.
 *
 * GET /api/catalog/offers
 *
 * Returns the data the homepage "عروض النهارده" section needs:
 *  - Active campaign offers (from the D1 `offers` table, with resolved products)
 *  - Discounted products (offer_price / compare_at pricing)
 *  - Featured products (is_featured flag — admin-curated picks)
 *
 * All reads go through the catalog service (D1 source of truth + KV cache).
 * No artificial data is ever invented — if no offers exist, empty arrays are
 * returned so the UI can render an honest empty state.
 */
export async function GET() {
  try {
    const result = await getDailyOffers(12)
    return ok(result)
  } catch (err) {
    console.error('Catalog offers error', err)
    return serverError('فشل تحميل العروض')
  }
}
