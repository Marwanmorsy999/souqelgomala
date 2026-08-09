import { NextRequest } from 'next/server'
import { getProductBySlug } from '@/services/catalog/service'
import { ok, notFound, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

/**
 * Public catalog product-by-slug endpoint.
 *
 * GET /api/catalog/products/:slug
 *
 * Returns a single active, visible product mapped to storefront shape.
 * Reads go through the catalog service (D1 source of truth + KV cache).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const product = await getProductBySlug(slug)
    if (!product) {
      return notFound('المنتج غير موجود')
    }
    return ok(product)
  } catch (err) {
    console.error('Catalog product-by-slug error', err)
    return serverError('فشل تحميل المنتج')
  }
}
