/**
 * Database Seed Helpers (D1 / Drizzle)
 *
 * Base seed data is applied through `drizzle/migrations/0002_seed_data.sql`.
 * The functions in this file are programmatic equivalents used by tests and
 * future data tools. They target the D1-backed `Db` instance and never run
 * on a schedule by themselves.
 */

import type { Db } from './client'
import { roles, settings, featureGroups, featureFlags } from './schema'
import { logger } from '@/lib/logger'

export const DEFAULT_ROLES: Array<{
  id: string
  label: string
  description: string
  permissions: string[]
}> = [
  {
    id: 'owner',
    label: 'مالك',
    description: 'Full access to all resources',
    permissions: ['*'],
  },
  {
    id: 'manager',
    label: 'مدير',
    description: 'Manages operational data; no employee management',
    permissions: [
      'dashboard.read',
      'orders.read', 'orders.write',
      'products.read', 'products.write',
      'categories.read', 'categories.write',
      'customers.read', 'customers.write',
      'delivery.read', 'delivery.write',
      'branches.read',
      'reports.read',
      'settings.read', 'settings.write',
      'suppliers.read', 'suppliers.write',
      'inventory.read', 'inventory.write',
      'offers.read', 'offers.write',
      'returns.read', 'returns.write',
    ],
  },
  {
    id: 'employee',
    label: 'موظف',
    description: 'Read access to core operations; order status updates',
    permissions: [
      'dashboard.read',
      'orders.read', 'orders.update',
      'products.read',
      'categories.read',
      'customers.read',
      'delivery.read',
      'branches.read',
    ],
  },
]

/** Insert the three canonical roles if they do not already exist. */
export async function seedRoles(db: Db): Promise<number> {
  const now = new Date().toISOString()
  let inserted = 0
  for (const role of DEFAULT_ROLES) {
    const existing = await db.query.roles.findFirst({
      where: (table, { eq }) => eq(table.id, role.id),
    })
    if (existing) continue
    await db.insert(roles).values({
      id: role.id,
      label: role.label,
      description: role.description,
      permissions: JSON.stringify(role.permissions),
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    inserted++
  }
  logger.info('Seed: roles ensured', { inserted })
  return inserted
}

/** Insert store defaults (currency, locale, order numbering policy). */
export async function seedSettings(db: Db): Promise<number> {
  const now = new Date().toISOString()
  const defaults: Array<{ key: string; value: string; description: string }> = [
    { key: 'store.currency', value: 'EGP', description: 'Default store currency' },
    { key: 'store.locale', value: 'ar-EG', description: 'Default locale' },
    { key: 'orders.number_prefix', value: 'SG', description: 'Order number prefix' },
    { key: 'notifications.enabled', value: 'true', description: 'Notifications toggle' },
  ]
  let inserted = 0
  for (const item of defaults) {
    const existing = await db.query.settings.findFirst({
      where: (table, { eq }) => eq(table.key, item.key),
    })
    if (existing) continue
    await db.insert(settings).values({
      id: crypto.randomUUID(),
      key: item.key,
      value: item.value,
      description: item.description,
      created_at: now,
      updated_at: now,
    })
    inserted++
  }
  logger.info('Seed: settings ensured', { inserted })
  return inserted
}
/**
 * Ensure feature groups/flags mirror `src/lib/constants.ts` (FEATURE_FLAG_KEYS).
 */
export async function seedFeatureFlags(db: Db): Promise<number> {
  const now = new Date().toISOString()
  const groups: Array<{ id: string; name: string; description: string; sortOrder: number }> = [
    { id: 'fgrp-storefront', name: 'storefront', description: 'Customer-facing storefront features', sortOrder: 1 },
    { id: 'fgrp-operations', name: 'operations', description: 'Operational modules', sortOrder: 2 },
    { id: 'fgrp-ai', name: 'ai', description: 'AI features', sortOrder: 3 },
  ]
  const flags: Array<{ id: string; key: string; groupId: string; label: string; description: string; enabled: boolean }> = [
    { id: 'ff-wishlist', key: 'wishlist', groupId: 'fgrp-storefront', label: 'قائمة الرغبات', description: 'Customer wishlist', enabled: false },
    { id: 'ff-reviews', key: 'reviews', groupId: 'fgrp-storefront', label: 'التقييمات', description: 'Product reviews', enabled: false },
    { id: 'ff-loyalty', key: 'loyalty', groupId: 'fgrp-storefront', label: 'نقاط الولاء', description: 'Loyalty program', enabled: false },
    { id: 'ff-coupons', key: 'coupons', groupId: 'fgrp-storefront', label: 'الكوبونات', description: 'Discount coupons', enabled: false },
    { id: 'ff-inventory', key: 'inventory', groupId: 'fgrp-operations', label: 'المخزون', description: 'Inventory module', enabled: true },
    { id: 'ff-suppliers', key: 'suppliers', groupId: 'fgrp-operations', label: 'الموردين', description: 'Suppliers module', enabled: true },
    { id: 'ff-purchase_orders', key: 'purchase_orders', groupId: 'fgrp-operations', label: 'أوامر الشراء', description: 'Purchase orders module', enabled: true },
    { id: 'ff-returns', key: 'returns', groupId: 'fgrp-operations', label: 'المرتجعات', description: 'Returns management module', enabled: true },
    { id: 'ff-ai_assistant', key: 'ai_assistant', groupId: 'fgrp-ai', label: 'المساعد الذكي', description: 'AI assistant features', enabled: false },
  ]

  let inserted = 0
  for (const group of groups) {
    const existing = await db.query.featureGroups.findFirst({
      where: (table, { eq }) => eq(table.name, group.name),
    })
    if (existing) continue
    await db.insert(featureGroups).values({
      id: group.id,
      name: group.name,
      description: group.description,
      sort_order: group.sortOrder,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    inserted++
  }
  for (const flag of flags) {
    const existing = await db.query.featureFlags.findFirst({
      where: (table, { eq }) => eq(table.key, flag.key),
    })
    if (existing) continue
    await db.insert(featureFlags).values({
      id: flag.id,
      key: flag.key,
      group_id: flag.groupId,
      label: flag.label,
      description: flag.description,
      is_enabled: flag.enabled,
      created_at: now,
      updated_at: now,
    })
    inserted++
  }
  logger.info('Seed: feature flags ensured', { inserted })
  return inserted
}

/** Run all non-destructive seed helpers. */
export async function seedCoreData(db: Db): Promise<void> {
  await seedRoles(db)
  await seedSettings(db)
  await seedFeatureFlags(db)
  logger.info('Seed: core data complete')
}