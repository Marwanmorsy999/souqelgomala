/**
 * Orders service — checkout persistence.
 *
 * The storefront checkout first persists the order to D1 (so the admin can see
 * and manage real orders), then hands the customer to WhatsApp with a formatted
 * Arabic payload. Line-item prices are stored according to the pricing mode the
 * customer chose (retail or wholesale) so the admin sees the exact amounts.
 *
 * `ensureOrdersTables()` guarantees the orders/order_items tables exist at
 * runtime on a fresh D1 instance (the same DDL is also present in the 0000
 * migration for `wrangler d1 migrations apply`).
 */

import { getDb } from '@/db'
import { orders, orderItems } from '@/db/schema/orders'
import { eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const CREATE_ORDERS = `
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY NOT NULL,
  order_number text NOT NULL UNIQUE,
  customer_id text,
  customer_name text,
  customer_phone text,
  customer_address text,
  branch_id text,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'website',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  subtotal real NOT NULL DEFAULT 0,
  discount real NOT NULL DEFAULT 0,
  delivery_fee real NOT NULL DEFAULT 0,
  total real NOT NULL DEFAULT 0,
  driver_id text,
  assigned_driver_name text,
  notes text,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  deleted_at text
);`

const CREATE_ITEMS = `
CREATE TABLE IF NOT EXISTS order_items (
  id text PRIMARY KEY NOT NULL,
  order_id text NOT NULL,
  product_id text,
  name_ar text NOT NULL,
  name_en text,
  quantity integer NOT NULL,
  unit_price real NOT NULL,
  total real NOT NULL,
  created_at text NOT NULL
);`

let ensured = false
async function ensureOrdersTables(): Promise<void> {
  if (ensured) return
  await getDb().run(sql.raw(CREATE_ORDERS))
  await getDb().run(sql.raw(CREATE_ITEMS))
  ensured = true
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0')
}

async function nextOrderNumber(): Promise<string> {
  const now = new Date()
  const ymd = `${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`
  const rows = (await getDb().run(
    sql.raw(
      `SELECT COUNT(*) AS c FROM orders WHERE order_number LIKE 'SG-${ymd}-%'`,
    ),
  )) as unknown as { results?: { c: number }[] }
  const count = rows.results?.[0]?.c ?? 0
  return `SG-${ymd}-${pad(count + 1, 6)}`
}

export interface OrderItemInput {
  id: string // product id
  name: string
  nameEn?: string
  quantity: number
  unitPrice: number
}

export interface CreateOrderInput {
  customerName: string
  customerPhone: string
  customerAddress: string
  notes?: string
  deliveryFee: number
  items: OrderItemInput[]
  pricingMode: 'retail' | 'wholesale'
  source?: 'website' | 'whatsapp' | 'admin'
}

export async function createOrder(input: CreateOrderInput) {
  await ensureOrdersTables()
  const ts = new Date().toISOString()
  const subtotal = input.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const total = subtotal + input.deliveryFee
  const orderId = nanoid(16)
  const orderNumber = await nextOrderNumber()

  await getDb().insert(orders).values({
    id: orderId,
    order_number: orderNumber,
    customer_name: input.customerName || null,
    customer_phone: input.customerPhone || null,
    customer_address: input.customerAddress || null,
    status: 'new',
    source: input.source ?? 'website',
    payment_status: 'pending',
    payment_method: 'cash',
    subtotal,
    discount: 0,
    delivery_fee: input.deliveryFee,
    total,
    notes: input.notes || null,
    created_at: ts,
    updated_at: ts,
  })

  for (const item of input.items) {
    await getDb()
      .insert(orderItems)
      .values({
        id: nanoid(16),
        order_id: orderId,
        product_id: item.id,
        name_ar: item.name,
        name_en: item.nameEn ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.unitPrice * item.quantity,
        created_at: ts,
      })
  }

  return { id: orderId, orderNumber, subtotal, deliveryFee: input.deliveryFee, total }
}

// --- Admin listing ---

export interface AdminOrderListItem {
  id: string
  orderNumber: string
  customerName: string | null
  customerPhone: string | null
  customerAddress: string | null
  status: string
  total: number
  createdAt: string
  itemsCount: number
}

export async function listOrders(limit = 100): Promise<AdminOrderListItem[]> {
  await ensureOrdersTables()
  const rows = await getDb()
    .select({
      id: orders.id,
      order_number: orders.order_number,
      customer_name: orders.customer_name,
      customer_phone: orders.customer_phone,
      customer_address: orders.customer_address,
      status: orders.status,
      total: orders.total,
      created_at: orders.created_at,
    })
    .from(orders)
    .where(sql`${orders.deleted_at} IS NULL`)
    .orderBy(sql`${orders.created_at} DESC`)
    .limit(limit)

  const items = await getDb()
    .select({ order_id: orderItems.order_id, quantity: orderItems.quantity })
    .from(orderItems)

  const counts = new Map<string, number>()
  for (const it of items) {
    counts.set(it.order_id, (counts.get(it.order_id) ?? 0) + it.quantity)
  }

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerAddress: r.customer_address,
    status: r.status,
    total: r.total,
    createdAt: r.created_at,
    itemsCount: counts.get(r.id) ?? 0,
  }))
}

export async function getOrderDetail(id: string) {
  await ensureOrdersTables()
  const [order] = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!order) return null
  const items = await getDb().select().from(orderItems).where(eq(orderItems.order_id, id))
  return { order, items }
}

const ORDER_STATUSES = [
  'new',
  'accepted',
  'preparing',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const

export async function updateOrderStatus(id: string, status: string) {
  await ensureOrdersTables()
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    throw new Error('حالة الطلب غير صالحة')
  }
  const existing = await getDb().select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1)
  if (!existing[0]) throw new Error('الطلب غير موجود')
  await getDb()
    .update(orders)
    .set({ status: status as (typeof ORDER_STATUSES)[number], updated_at: new Date().toISOString() })
    .where(eq(orders.id, id))
  return { success: true, status }
}

/** Soft-delete an order so history is preserved but it disappears from listings. */
export async function deleteOrder(id: string): Promise<void> {
  await ensureOrdersTables()
  const existing = await getDb().select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1)
  if (!existing[0]) throw new Error('الطلب غير موجود')
  await getDb()
    .update(orders)
    .set({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .where(eq(orders.id, id))
}

export interface AdminCreateOrderItemInput {
  productId?: string | null
  name: string
  quantity: number
  unitPrice: number
}

export interface AdminCreateOrderInput {
  customerName: string
  customerPhone: string
  customerAddress?: string
  notes?: string
  deliveryFee: number
  items: AdminCreateOrderItemInput[]
}

/**
 * Admin-side order creation (phone / walk-in orders).
 * Reuses the storefront numbering scheme and pricing rules.
 */
export async function createAdminOrder(input: AdminCreateOrderInput) {
  await ensureOrdersTables()
  const items = input.items.filter((i) => i.name.trim() && i.quantity > 0 && i.unitPrice >= 0)
  if (items.length === 0) {
    throw new Error('أضف صنفاً واحداً على الأقل للطلب')
  }
  return createOrder({
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress ?? '',
    notes: input.notes,
    deliveryFee: input.deliveryFee,
    items: items.map((i) => ({
      id: i.productId ?? '',
      name: i.name.trim(),
      quantity: Math.max(1, Math.round(i.quantity)),
      unitPrice: i.unitPrice,
    })),
    pricingMode: 'retail',
    source: 'admin',
  })
}
