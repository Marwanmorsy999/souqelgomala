import { NextRequest } from 'next/server'
import {
  getProducts,
  getProductsByIds,
  searchProducts,
  getDiscountedProducts,
} from '@/services/catalog/service'
import type { ProductSort } from '@/services/catalog/repository'
import { ok, paginated, fail, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

const SORT_VALUES: ProductSort[] = [
  'default',
  'price_asc',
  'price_desc',
  'newest',
  'best_seller',
  'featured',
]

/**
 * Public catalog products endpoint.
 *
 * GET /api/catalog/products
 *   ?categoryId=&search=&discounted=true&minPrice=&maxPrice=&unit=&inStock=true&sort=
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

    const minPriceRaw = sp.get('minPrice')
    const maxPriceRaw = sp.get('maxPrice')
    const minPrice = minPriceRaw != null && minPriceRaw !== '' ? Number(minPriceRaw) : undefined
    const maxPrice = maxPriceRaw != null && maxPriceRaw !== '' ? Number(maxPriceRaw) : undefined
    const unit = sp.get('unit') ?? undefined
    const inStock = sp.get('inStock') === 'true'
    const sortRaw = sp.get('sort') as ProductSort | null
    const sort = sortRaw && SORT_VALUES.includes(sortRaw) ? sortRaw : undefined

    if (search) {
      const result = await searchProducts(search, page, pageSize)
      return paginated(result.data, result.page, result.pageSize, result.total)
    }

    if (discounted) {
      const result = await getDiscountedProducts(page, pageSize)
      return paginated(result.data, result.page, result.pageSize, result.total)
    }

    // Explicit id set (cart items) — resolved without loading the whole catalog.
    const idsRaw = sp.get('ids')
    if (idsRaw && idsRaw.trim()) {
      const ids = idsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      const result = await getProductsByIds(ids)
      return ok(result)
    }

    const result = await getProducts(
      {
        categoryId,
        minPrice: minPrice != null && Number.isFinite(minPrice) ? minPrice : undefined,
        maxPrice: maxPrice != null && Number.isFinite(maxPrice) ? maxPrice : undefined,
        unit,
        inStockOnly: inStock || undefined,
        sort: sort ?? undefined,
      },
      page,
      pageSize
    )
    return paginated(result.data, result.page, result.pageSize, result.total)
  } catch (err) {
    console.error('Catalog products error', err)
    return serverError('فشل تحميل المنتجات')
  }
}
