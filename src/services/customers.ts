/**
 * Customers service — admin CRM data backed by D1.
 *
 * Lists customers with their order history so the business can fulfill and
 * follow up. Only data that exists in D1 is shown — no fake profiles. Orders
 * are matched to a customer by `customer_id` (falling back to phone) so every
 * website checkout that includes their phone shows up in their history.
 */

import { getDb } from '@/db'
import { customers } from '@/db/schema/customers'
import { orders, orderItems } from '@/db/schema/orders'
import { eq, desc, or, like, isNull, sql, and } from 'drizzle-orm'

export interface CustomerListItem {
  id: string
  name: string | null
  phone: string
  email: string | null
  totalSpending: number
  orderCount: number
  isVip: boolean
  isBlacklisted: boolean
  notes: string | null
  createdAt: string
  lastOrderAt: string | null
}

export async function listCustomersAdmin(opts: { search?: string; limit?: number } = {}) {
  const limit = Math.min(200, Math.max(1, opts.limit ?? 100))
  const q = opts.search?.trim()

  const base = getDb()
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      total_spending: customers.total_spending,
      order_count: customers.order_count,
      is_vip: customers.is_vip,
      is_blacklisted: customers.is_blacklisted,
      notes: customers.notes,
      created_at: customers.created_at,
    })
    .from(customers)
    .where(
      and(
        isNull(customers.deleted_at),
        q
          ? or(
              like(customers.phone, `%${q}%`),
              like(customers.name ?? '', `%${q}%`),
              like(customers.email ?? '', `%${q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(customers.total_spending))
    .limit(limit)

  const rows = await base

  // Last order date per customer (id OR phone match) in one pass.
  const ids = rows.map((r) => r.id)
  const phones = rows.map((r) => r.phone).filter(Boolean)
  let lastOrders = new Map<string, string>()
  if (ids.length) {
    const rowsOrdered = await getDb()
      .select({ customer_id: orders.customer_id, customer_phone: orders.customer_phone, created_at: orders.created_at })
      .from(orders)
      .where(and(isNull(orders.deleted_at), or(inIds(ids, orders.customer_id), inPhones(phones, orders.customer_phone))))
      .orderBy(desc(orders.created_at))

    for (const r of rowsOrdered) {
      const key = r.customer_id ?? (r.customer_phone && phones.includes(r.customer_phone) ? r.customer_phone : null)
      if (key && !lastOrders.has(key)) lastOrders.set(key, r.created_at)
    }
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    totalSpending: r.total_spending,
    orderCount: r.order_count,
    isVip: r.is_vip,
    isBlacklisted: r.is_blacklisted,
    notes: r.notes,
    createdAt: r.created_at,
    lastOrderAt: (lastOrders.get(r.id) ?? (r.phone ? lastOrders.get(r.phone) : null)) ?? null,
  }))
}

function inIds(ids: string[], column: typeof orders.customer_id) {
  return ids.length ? sql`${column} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})` : sql`0`
}
function inPhones(phones: string[], column: typeof orders.customer_phone) {
  return phones.length ? sql`${column} IN (${sql.join(phones.map((p) => sql`${p}`), sql`, `)})` : sql`0`
}

/** Customer detail with their orders (and line items). */
export async function getCustomerDetail(id: string) {
  const [customer] = await getDb()
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), isNull(customers.deleted_at)))
    .limit(1)
  if (!customer) return null

  const customerOrders = await getDb()
    .select()
    .from(orders)
    .where(
      and(
        isNull(orders.deleted_at),
        or(eq(orders.customer_id, customer.id), eq(orders.customer_phone, customer.phone)),
      ),
    )
    .orderBy(desc(orders.created_at))

  const orderIds = customerOrders.map((o) => o.id)
  const allItems = orderIds.length
    ? await getDb().select().from(orderItems).where(sql`${orderItems.order_id} IN (${sql.join(orderIds.map((id) => sql`${id}`), sql`, `)})`)
    : []

  const itemsByOrder = new Map<string, typeof allItems>()
  for (const item of allItems) {
    const list = itemsByOrder.get(item.order_id) ?? []
    list.push(item)
    itemsByOrder.set(item.order_id, list)
  }

  return {
    customer: {
      ...customer,
      addresses: [],
    },
    orders: customerOrders.map((o) => ({
      ...o,
      itemsCount: (itemsByOrder.get(o.id) ?? []).reduce((s, it) => s + it.quantity, 0),
      items: itemsByOrder.get(o.id) ?? [],
    })),
  }
}