/**
 * Delivery service — couriers (drivers), delivery zones (areas) and
 * live assignment counts for the admin delivery module.
 *
 * Tables follow the same runtime-ensure pattern as the orders service so a
 * fresh D1 instance never 500s before `wrangler d1 migrations apply` runs.
 * Every mutation is permission-gated by the calling route handler.
 */

import { getDb } from '@/db'
import { deliveryDrivers, deliveryAreas, type DriverStatus } from '@/db/schema/delivery'
import { orders } from '@/db/schema/orders'
import { and, count, eq, isNull, sql, inArray } from 'drizzle-orm'

export type { DriverStatus }

const CREATE_DRIVERS = `
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  vehicle text,
  branch_id text,
  status text NOT NULL DEFAULT 'available',
  current_order_id text,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  deleted_at text
);`

const CREATE_AREAS = `
CREATE TABLE IF NOT EXISTS delivery_areas (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  city text NOT NULL,
  fee real NOT NULL DEFAULT 0,
  min_order real NOT NULL DEFAULT 0,
  is_active integer NOT NULL DEFAULT 1,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  deleted_at text
);`

let ensured = false
async function ensureDeliveryTables(): Promise<void> {
  if (ensured) return
  await getDb().run(sql.raw(CREATE_DRIVERS))
  await getDb().run(sql.raw(CREATE_AREAS))
  ensured = true
}

function now(): string {
  return new Date().toISOString()
}

// ---------------------------------------------------------------------------
// DRIVERS (المناديب)
// ---------------------------------------------------------------------------

export interface DriverRow {
  id: string
  name: string
  phone: string
  vehicle: string | null
  status: DriverStatus
  activeOrdersCount: number
  createdAt: string
  updatedAt: string
}

const DRIVER_STATUSES: DriverStatus[] = ['available', 'busy', 'offline']

export async function listDrivers(): Promise<DriverRow[]> {
  await ensureDeliveryTables()
  const rows = await getDb()
    .select()
    .from(deliveryDrivers)
    .where(isNull(deliveryDrivers.deleted_at))
    .orderBy(deliveryDrivers.name)

  // Live workload — open assignments per driver.
  let busyCounts = new Map<string, number>()
  const ids = rows.map((r) => r.id)
  if (ids.length > 0) {
    const assigned = await getDb()
      .select({ driver_id: orders.driver_id, total: count() })
      .from(orders)
      .where(and(inArray(orders.driver_id, ids), isNull(orders.deleted_at)))
      .groupBy(orders.driver_id)
    busyCounts = new Map(assigned.filter((r) => r.driver_id).map((r) => [r.driver_id as string, Number(r.total)]))
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    vehicle: r.vehicle,
    status: r.status,
    activeOrdersCount: busyCounts.get(r.id) ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function createDriver(input: {
  name: string
  phone: string
  vehicle?: string
  status?: DriverStatus
}): Promise<DriverRow> {
  await ensureDeliveryTables()
  const ts = now()
  const [row] = await getDb()
    .insert(deliveryDrivers)
    .values({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      phone: input.phone.trim(),
      vehicle: input.vehicle?.trim() || null,
      branch_id: null,
      status: input.status && DRIVER_STATUSES.includes(input.status) ? input.status : 'available',
      created_at: ts,
      updated_at: ts,
    })
    .returning()
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    vehicle: row.vehicle,
    status: row.status,
    activeOrdersCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateDriver(
  id: string,
  patch: Partial<{ name: string; phone: string; vehicle: string; status: DriverStatus }>,
): Promise<void> {
  await ensureDeliveryTables()
  const [existing] = await getDb().select({ id: deliveryDrivers.id }).from(deliveryDrivers).where(eq(deliveryDrivers.id, id)).limit(1)
  if (!existing) throw new Error('المندوب غير موجود')
  if (patch.status && !DRIVER_STATUSES.includes(patch.status)) throw new Error('حالة المندوب غير صالحة')
  await getDb()
    .update(deliveryDrivers)
    .set({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone.trim() } : {}),
      ...(patch.vehicle !== undefined ? { vehicle: patch.vehicle.trim() || null } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      updated_at: now(),
    })
    .where(eq(deliveryDrivers.id, id))
}

export async function deleteDriver(id: string): Promise<void> {
  await ensureDeliveryTables()
  const [existing] = await getDb().select({ id: deliveryDrivers.id }).from(deliveryDrivers).where(eq(deliveryDrivers.id, id)).limit(1)
  if (!existing) throw new Error('المندوب غير موجود')
  await getDb().update(deliveryDrivers).set({ deleted_at: now(), updated_at: now() }).where(eq(deliveryDrivers.id, id))
}

// ---------------------------------------------------------------------------
// DELIVERY AREAS / ZONES (مناطق التوصيل)
// ---------------------------------------------------------------------------

export interface AreaRow {
  id: string
  name: string
  city: string
  fee: number
  minOrder: number
  isActive: boolean
  ordersCount: number
  createdAt: string
  updatedAt: string
}

export async function listAreas(): Promise<AreaRow[]> {
  await ensureDeliveryTables()
  const rows = await getDb()
    .select()
    .from(deliveryAreas)
    .where(isNull(deliveryAreas.deleted_at))
    .orderBy(deliveryAreas.city, deliveryAreas.name)

  // Orders per zone — matched on the customer address containing the zone name.
  const orderRows = await getDb()
    .select({ address: orders.customer_address })
    .from(orders)
    .where(isNull(orders.deleted_at))
  const countsByArea = new Map<string, number>()
  for (const area of rows) {
    const needle = area.name.trim()
    if (!needle) continue
    countsByArea.set(
      area.id,
      orderRows.filter((o) => (o.address ?? '').includes(needle)).length,
    )
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city,
    fee: r.fee,
    minOrder: r.min_order,
    isActive: r.is_active,
    ordersCount: countsByArea.get(r.id) ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function createArea(input: {
  name: string
  city: string
  fee: number
  minOrder?: number
  isActive?: boolean
}): Promise<AreaRow> {
  await ensureDeliveryTables()
  const ts = now()
  const [row] = await getDb()
    .insert(deliveryAreas)
    .values({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      city: input.city.trim(),
      fee: input.fee,
      min_order: input.minOrder ?? 0,
      is_active: input.isActive ?? true,
      created_at: ts,
      updated_at: ts,
    })
    .returning()
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    fee: row.fee,
    minOrder: row.min_order,
    isActive: row.is_active,
    ordersCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateArea(
  id: string,
  patch: Partial<{ name: string; city: string; fee: number; minOrder: number; isActive: boolean }>,
): Promise<void> {
  await ensureDeliveryTables()
  const [existing] = await getDb().select({ id: deliveryAreas.id }).from(deliveryAreas).where(eq(deliveryAreas.id, id)).limit(1)
  if (!existing) throw new Error('المنطقة غير موجودة')
  await getDb()
    .update(deliveryAreas)
    .set({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.city !== undefined ? { city: patch.city.trim() } : {}),
      ...(patch.fee !== undefined ? { fee: patch.fee } : {}),
      ...(patch.minOrder !== undefined ? { min_order: patch.minOrder } : {}),
      ...(patch.isActive !== undefined ? { is_active: patch.isActive } : {}),
      updated_at: now(),
    })
    .where(eq(deliveryAreas.id, id))
}

export async function deleteArea(id: string): Promise<void> {
  await ensureDeliveryTables()
  const [existing] = await getDb().select({ id: deliveryAreas.id }).from(deliveryAreas).where(eq(deliveryAreas.id, id)).limit(1)
  if (!existing) throw new Error('المنطقة غير موجودة')
  await getDb().update(deliveryAreas).set({ deleted_at: now(), updated_at: now() }).where(eq(deliveryAreas.id, id))
}

// ---------------------------------------------------------------------------
// HUB SUMMARY (for the delivery overview page)
// ---------------------------------------------------------------------------

export interface DeliverySummary {
  driversTotal: number
  driversAvailable: number
  areasTotal: number
  areasActive: number
  outForDeliveryOrders: number
}

export async function getDeliverySummary(): Promise<DeliverySummary> {
  await ensureDeliveryTables()
  const [drivers, areas] = await Promise.all([
    listDrivers(),
    listAreas(),
  ])
  const [outForDelivery] = await getDb()
    .select({ value: count() })
    .from(orders)
    .where(and(eq(orders.status, 'out_for_delivery'), isNull(orders.deleted_at)))

  return {
    driversTotal: drivers.length,
    driversAvailable: drivers.filter((d) => d.status === 'available').length,
    areasTotal: areas.length,
    areasActive: areas.filter((a) => a.isActive).length,
    outForDeliveryOrders: Number(outForDelivery?.value ?? 0),
  }
}
