import { NextRequest } from 'next/server'
import {
  getCategories,
  getFeaturedProducts,
  getBestSellerProducts,
  getLatestProducts,
} from '@/services/catalog/service'
import { ok, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

/**
 * Public catalog homepage endpoint.
 *
 * GET /api/catalog/home
 *
 * Returns the data the homepage needs in one request: categories, featured
 * products, best sellers, and latest products. All reads go through the catalog
 * service (D1 source of truth + KV cache).
 */
export async function GET() {
  try {
    const [categories, featured, bestSellers, latest] = await Promise.all([
      getCategories(),
      getFeaturedProducts(8),
      getBestSellerProducts(8),
      getLatestProducts(6),
    ])
    return ok({ categories, featured, bestSellers, latest })
  } catch (err) {
    console.error('Catalog home error', err)
    return serverError('فشل تحميل الصفحة الرئيسية')
  }
}
