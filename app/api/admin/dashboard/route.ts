import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, serverError } from '@/services/api-response'
import { getDb } from '@/db'
import { products, categories } from '@/db/schema/catalog'
import { offers } from '@/db/schema/offers'
import { orders, orderItems } from '@/db/schema/orders'
import { and, count, eq, gte, inArray, lte, isNull, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

function startOfLocalDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Admin dashboard endpoint.
 *
 * GET /api/admin/dashboard
 *
 * Returns real, D1-backed business metrics (no demo data):
 *  - Quick insights: live sales today, total orders, active products,
 *    products/categories counts, new orders
 *  - 7-day sales trend (sales + orders per day)
 *  - Recent orders (last 5)
 *  - Today's active offers
 *
 * Authorization enforced server-side (dashboard.read).
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'dashboard.read')) {
    return forbidden('ليس لديك صلاحية لعرض لوحة التحكم')
  }

  try {
    const db = getDb()

    const todayStart = startOfLocalDay(new Date())

    const [productsCount, categoriesCount, offersCount, newOrdersCount, totalOrdersCount, activeProductsCount] =
      await Promise.all([
        db
          .select({ value: count() })
          .from(products)
          .where(isNull(products.deleted_at))
          .then((r) => r[0]?.value ?? 0),
        db
          .select({ value: count() })
          .from(categories)
          .where(isNull(categories.deleted_at))
          .then((r) => r[0]?.value ?? 0),
        db
          .select({ value: count() })
          .from(offers)
          .where(
            and(
              eq(offers.status, 'active'),
              isNull(offers.deleted_at),
            ),
          )
          .then((r) => r[0]?.value ?? 0),
        db
          .select({ value: count() })
          .from(orders)
          .where(and(eq(orders.status, 'new'), isNull(orders.deleted_at)))
          .then((r) => r[0]?.value ?? 0),
        db
          .select({ value: count() })
          .from(orders)
          .where(isNull(orders.deleted_at))
          .then((r) => r[0]?.value ?? 0),
        db
          .select({ value: count() })
          .from(products)
          .where(
            and(
              isNull(products.deleted_at),
              eq(products.status, 'active'),
              gte(products.stock, 1),
            ),
          )
          .then((r) => r[0]?.value ?? 0),
      ])

    // Quick insight — live sales today + orders placed today.
    const todayRows = await db
      .select({
        total: orders.total,
        status: orders.status,
        createdAt: orders.created_at,
      })
      .from(orders)
      .where(and(gte(orders.created_at, todayStart.toISOString()), isNull(orders.deleted_at)))

    const salesToday = todayRows
      .filter((r) => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (Number(r.total) || 0), 0)
    const ordersToday = todayRows.length

    // 7-day sales trend — aggregate real order rows per calendar day.
    const weekStart = startOfLocalDay(new Date(Date.now() - 6 * DAY_MS))
    const trendRows = await db
      .select({
        total: orders.total,
        status: orders.status,
        createdAt: orders.created_at,
      })
      .from(orders)
      .where(and(gte(orders.created_at, weekStart.toISOString()), isNull(orders.deleted_at)))

    const buckets = new Map<string, { sales: number; orders: number }>()
    for (let i = 6; i >= 0; i -= 1) {
      const day = startOfLocalDay(new Date(Date.now() - i * DAY_MS))
      buckets.set(day.toISOString().slice(0, 10), { sales: 0, orders: 0 })
    }
    for (const row of trendRows) {
      const key = row.createdAt.slice(0, 10)
      const bucket = buckets.get(key)
      if (!bucket) continue
      bucket.orders += 1
      if (row.status !== 'cancelled') {
        bucket.sales += Number(row.total) || 0
      }
    }
    const AR_DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const salesTrend = Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      label: `${AR_DAY_NAMES[new Date(`${date}T00:00:00`).getDay()]}`,
      sales: Math.round(v.sales * 100) / 100,
      orders: v.orders,
    }))

    // Recent orders (last 5) with item counts
    const recentOrderRows = await db
      .select({
        id: orders.id,
        order_number: orders.order_number,
        customer_name: orders.customer_name,
        customer_phone: orders.customer_phone,
        status: orders.status,
        total: orders.total,
        created_at: orders.created_at,
      })
      .from(orders)
      .where(isNull(orders.deleted_at))
      .orderBy(desc(orders.created_at))
      .limit(5)

    // Item counts per order (simple count)
    const recentOrderIds = recentOrderRows.map((r) => r.id)
    let itemCountMap = new Map<string, number>()
    if (recentOrderIds.length) {
      const itemCounts = await db
        .select({ order_id: orderItems.order_id, total: count() })
        .from(orderItems)
                      .where(inArray(orderItems.order_id, recentOrderIds))
        .groupBy(orderItems.order_id)
      itemCountMap = new Map(itemCounts.map((c) => [c.order_id, Number(c.total)]))
    }

    const recentOrders = recentOrderRows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      status: r.status,
      total: r.total,
      createdAt: r.created_at,
      itemsCount: itemCountMap.get(r.id) ?? 0,
    }))

    // Today's active offers (within date window)
    const now = new Date().toISOString()
    const todaysOffersRows = await db
      .select()
      .from(offers)
      .where(
        and(
          eq(offers.status, 'active'),
          lte(offers.start_date, now),
          gte(offers.end_date, now),
          isNull(offers.deleted_at),
        ),
      )
      .orderBy(desc(offers.start_date))
      .limit(10)

    // Resolve product names for today's offers
    const allProductIds = [
      ...new Set(
        todaysOffersRows
          .flatMap((o) => {
            try {
              return JSON.parse(o.product_ids || '[]') as string[]
            } catch {
              return []
            }
          })
          .filter(Boolean),
      ),
    ]
    let productNames = new Map<string, string>()
    if (allProductIds.length) {
      const matches = await db
        .select({ id: products.id, name_ar: products.name_ar })
        .from(products)
                .where(inArray(products.id, allProductIds))
      productNames = new Map(matches.map((m) => [m.id, m.name_ar]))
    }

    const todaysOffers = todaysOffersRows.map((o) => {
      const ids = (() => {
        try {
          return JSON.parse(o.product_ids || '[]') as string[]
        } catch {
          return []
        }
      })()
      return {
        id: o.id,
        campaign_name: o.campaign_name,
        banner: o.banner,
        discount_type: o.discount_type,
        value: o.value,
        product_ids: ids,
        productCount: ids.length,
        productNames: ids
          .map((id) => productNames.get(id) ?? null)
          .filter(Boolean)
          .slice(0, 6),
        start_date: o.start_date,
        end_date: o.end_date,
        status: o.status,
        created_at: o.created_at,
        updated_at: o.updated_at,
      }
    })

    return ok({
      stats: {
        productsCount,
        categoriesCount,
        offersCount,
        newOrdersCount,
        totalOrdersCount,
        activeProductsCount,
        salesToday,
        ordersToday,
      },
      salesTrend,
      recentOrders,
      todaysOffers,
    })
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل لوحة التحكم')
  }
}