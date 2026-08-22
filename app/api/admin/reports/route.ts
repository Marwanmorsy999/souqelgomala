import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { ok, forbidden, serverError } from '@/services/api-response'
import { hasPermission, type Role } from '@/lib/permissions'
import { getDb } from '@/db'
import { products } from '@/db/schema/catalog'
import { orders, orderItems } from '@/db/schema/orders'
import { and, count, desc, eq, gte, isNull, sql, sum } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * GET /api/admin/reports — basic insights for the reports module
 * (RBAC: reports.read).
 *
 * Returns real aggregates over the last 30 days:
 *  - totals (revenue, orders, avg basket)
 *  - revenue by day
 *  - orders by status
 *  - top products by sold quantity
 *  - low-stock watchlist
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'reports.read')) {
    return forbidden('ليس لديك صلاحية لعرض التقارير')
  }

  try {
    const db = getDb()
    const since = new Date(Date.now() - 29 * DAY_MS)
    since.setHours(0, 0, 0, 0)

    // Totals over the window.
    const [totalsRow] = await db
      .select({
        revenue: sum(orders.total),
        count: count(),
      })
      .from(orders)
      .where(
        and(
          gte(orders.created_at, since.toISOString()),
          isNull(orders.deleted_at),
          sql`${orders.status} != 'cancelled'`,
        ),
      )

    const revenue = Number(totalsRow?.revenue ?? 0)
    const ordersCount = Number(totalsRow?.count ?? 0)

    // Revenue by day.
    const dailyRows = await db
      .select({
        createdAt: orders.created_at,
        total: orders.total,
      })
      .from(orders)
      .where(
        and(
          gte(orders.created_at, since.toISOString()),
          isNull(orders.deleted_at),
          sql`${orders.status} != 'cancelled'`,
        ),
      )
    const buckets = new Map<string, number>()
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * DAY_MS)
      d.setHours(0, 0, 0, 0)
      buckets.set(d.toISOString().slice(0, 10), 0)
    }
    for (const row of dailyRows) {
      const key = row.createdAt.slice(0, 10)
      if (!buckets.has(key)) continue
      buckets.set(key, (buckets.get(key) ?? 0) + (Number(row.total) || 0))
    }
    const revenueByDay = Array.from(buckets.entries()).map(([date, value]) => ({
      date,
      revenue: Math.round(value * 100) / 100,
    }))

    // Orders by status.
    const statusRows = await db
      .select({ status: orders.status, total: count() })
      .from(orders)
      .where(isNull(orders.deleted_at))
      .groupBy(orders.status)

    // Top products by quantity sold in the window.
    const topProductsRows = await db
      .select({
        name: orderItems.name_ar,
        productId: orderItems.product_id,
        quantity: sql<number>`sum(${orderItems.quantity})`,
        revenue: sql<number>`sum(${orderItems.total})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(and(gte(orders.created_at, since.toISOString()), isNull(orders.deleted_at)))
      .groupBy(orderItems.name_ar, orderItems.product_id)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(10)

    // Low stock watchlist.
    const lowStock = await db
      .select({
        id: products.id,
        nameAr: products.name_ar,
        stock: products.stock,
        threshold: products.low_stock_threshold,
      })
      .from(products)
      .where(and(isNull(products.deleted_at), eq(products.status, 'active')))
      .orderBy(products.stock)
      .limit(50)

    return ok({
      periodDays: 30,
      totals: {
        revenue,
        ordersCount,
        avgBasket: ordersCount > 0 ? Math.round((revenue / ordersCount) * 100) / 100 : 0,
      },
      revenueByDay,
      ordersByStatus: statusRows.map((r) => ({ status: r.status, count: Number(r.total) })),
      topProducts: topProductsRows.map((r) => ({
        name: r.name,
        productId: r.productId,
        quantity: Number(r.quantity),
        revenue: Math.round(Number(r.revenue) * 100) / 100,
      })),      lowStockWatchlist: lowStock
        .filter((p) => p.stock <= p.threshold)
        .map((p) => ({
          id: p.id,
          name: p.nameAr,
          stock: p.stock,
          threshold: p.threshold,
        })),
    })
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل التقارير')
  }
}
