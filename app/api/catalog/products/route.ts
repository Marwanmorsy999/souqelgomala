import { NextRequest } from 'next/server'
import {
  getProducts,
  searchProducts,
  getDiscountedProducts,
} from '@/services/catalog/service'
import { ok, paginated, fail, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

/**
 * Public catalog products endpoint.
 *
 * GET /api/catalog/products?categoryId=&search=&discounted=true&page=&pageSize=
 *
 * Returns active, visible, non-deleted products mapped to storefront shape.
 * Reads go through the catalog service (D1 source of truth + KV cache).
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const categoryId = sp.get('categoryId') ?? undefined
    const search = sp.get('search') ?? undefined
    const discounted = sp.get('discounted') === 'true'
    const page = Math.max(1, Number(sp.get('page') ?? '1') || 1)
    const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? '20') || 20))

    if (search) {
      const result = await searchProducts(search, page, pageSize)
      return paginated(result.data, result.page, result.pageSize, result.total)
    }

    if (discounted) {
      const result = await getDiscountedProducts(page, pageSize)
      return paginated(result.data, result.page, result.pageSize, result.total)
    }

    const result = await getProducts(
      categoryId ? { categoryId } : {},
      page,
      pageSize
    )
    return paginated(result.data, result.page, result.pageSize, result.total)
  } catch (err) {
    console.error('Catalog products error', err)
    return serverError('فشل تحميل المنتجات')
  }
}
