/**
 * Site Structure Service — admin-managed site-wide layout & settings.
 *
 * CRUD for: site_settings (general/business config), nav_links, footer_links,
 * homepage_sections, delivery_zones, static_pages, seo_settings.
 *
 * Every mutation is permission-gated (the route handlers pass the resolved
 * user in). D1 is the source of truth. No secrets, no Node-only deps.
 */

import { getDb } from '@/db'
import {
  navLinks,
  footerLinks,
  homepageSections,
  deliveryZones,
  staticPages,
  seoSettings,
  siteSettings,
  type LinkTarget,
  type FooterSection,
  type HomepageSectionKey,
  type SeoPageKey,
} from '@/db/schema/site-structure'
import { categories, products } from '@/db/schema/catalog'
import { eq, inArray, asc, sql } from 'drizzle-orm'
import { hasPermission, type Role } from '@/lib/permissions'
import type { User } from '@/services/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString()
}

function assertCan(user: User, permission: string): void {
  if (!hasPermission(user.role as Role, permission)) {
    throw new SiteStructureError('ليس لديك صلاحية لهذه العملية', 403)
  }
}

export class SiteStructureError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'SiteStructureError'
  }
}

// ---------------------------------------------------------------------------
// SITE SETTINGS (single business-config row)
// ---------------------------------------------------------------------------

export type SiteSettingsRow = typeof siteSettings.$inferSelect

const SETTINGS_ID = 'site'

export async function getSiteSettingsRow(): Promise<SiteSettingsRow> {
  const [row] = await getDb()
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID))
    .limit(1)
  if (row) return row
  // Lazily create a default row if it does not exist.
  const created: SiteSettingsRow = {
    id: SETTINGS_ID,
    business_name: 'سوق الجملة',
    logo_url: null,
    phone_primary: null,
    phone_secondary: null,
    address: null,
    whatsapp_number: null,
    facebook_url: null,
    instagram_url: null,
    tiktok_url: null,
    min_order_value: 0,
    free_delivery_threshold: 0,
    default_delivery_fee: 0,
    updated_by: null,
    updated_at: now(),
  }
  await getDb().insert(siteSettings).values(created)
  return created
}

export type SiteSettingsPatch = Partial<{
  business_name: string
  logo_url: string | null
  phone_primary: string | null
  phone_secondary: string | null
  address: string | null
  whatsapp_number: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  min_order_value: number
  free_delivery_threshold: number
  default_delivery_fee: number
}>

export async function updateSiteSettingsRow(
  user: User,
  patch: SiteSettingsPatch,
): Promise<SiteSettingsRow> {
  assertCan(user, 'settings.write')
  const existing = await getSiteSettingsRow()
  const next: SiteSettingsRow = {
    ...existing,
    ...patch,
    updated_by: user.id,
    updated_at: now(),
  }
  await getDb()
    .update(siteSettings)
    .set(next)
    .where(eq(siteSettings.id, SETTINGS_ID))
  return next
}

// ---------------------------------------------------------------------------
// NAV LINKS
// ---------------------------------------------------------------------------

export type NavLinkRow = typeof navLinks.$inferSelect

export async function listNavLinks(): Promise<NavLinkRow[]> {
  return getDb().select().from(navLinks).orderBy(asc(navLinks.sort_order))
}

export async function createNavLink(
  user: User,
  input: { label: string; url: string; sortOrder?: number; visible?: boolean; target?: LinkTarget },
): Promise<NavLinkRow> {
  assertCan(user, 'settings.write')
  const [row] = await getDb()
    .insert(navLinks)
    .values({
      id: crypto.randomUUID(),
      label: input.label,
      url: input.url,
      sort_order: input.sortOrder ?? 0,
      visible: input.visible ?? true,
      target: input.target ?? 'internal',
      created_at: now(),
      updated_at: now(),
    })
    .returning()
  return row
}

export async function updateNavLink(
  user: User,
  id: string,
  input: Partial<{ label: string; url: string; sortOrder: number; visible: boolean; target: LinkTarget }>,
): Promise<NavLinkRow> {
  assertCan(user, 'settings.write')
  const [existing] = await getDb().select().from(navLinks).where(eq(navLinks.id, id)).limit(1)
  if (!existing) throw new SiteStructureError('الرابط غير موجود', 404)
  const [row] = await getDb()
    .update(navLinks)
    .set({ ...input, updated_at: now() })
    .where(eq(navLinks.id, id))
    .returning()
  return row
}

export async function deleteNavLink(user: User, id: string): Promise<void> {
  assertCan(user, 'settings.write')
  await getDb().delete(navLinks).where(eq(navLinks.id, id))
}

export async function reorderNavLinks(user: User, ids: string[]): Promise<void> {
  assertCan(user, 'settings.write')
  await applyReorder(navLinks, navLinks.id, ids)
}

// ---------------------------------------------------------------------------
// FOOTER LINKS
// ---------------------------------------------------------------------------

export type FooterLinkRow = typeof footerLinks.$inferSelect

export async function listFooterLinks(): Promise<FooterLinkRow[]> {
  return getDb().select().from(footerLinks).orderBy(asc(footerLinks.section), asc(footerLinks.sort_order))
}

export async function createFooterLink(
  user: User,
  input: { section: FooterSection; label: string; url: string; sortOrder?: number; visible?: boolean },
): Promise<FooterLinkRow> {
  assertCan(user, 'settings.write')
  const [row] = await getDb()
    .insert(footerLinks)
    .values({
      id: crypto.randomUUID(),
      section: input.section,
      label: input.label,
      url: input.url,
      sort_order: input.sortOrder ?? 0,
      visible: input.visible ?? true,
      created_at: now(),
      updated_at: now(),
    })
    .returning()
  return row
}

export async function updateFooterLink(
  user: User,
  id: string,
  input: Partial<{ section: FooterSection; label: string; url: string; sortOrder: number; visible: boolean }>,
): Promise<FooterLinkRow> {
  assertCan(user, 'settings.write')
  const [existing] = await getDb().select().from(footerLinks).where(eq(footerLinks.id, id)).limit(1)
  if (!existing) throw new SiteStructureError('الرابط غير موجود', 404)
  const [row] = await getDb()
    .update(footerLinks)
    .set({ ...input, updated_at: now() })
    .where(eq(footerLinks.id, id))
    .returning()
  return row
}

export async function deleteFooterLink(user: User, id: string): Promise<void> {
  assertCan(user, 'settings.write')
  await getDb().delete(footerLinks).where(eq(footerLinks.id, id))
}

export async function reorderFooterLinks(user: User, ids: string[]): Promise<void> {
  assertCan(user, 'settings.write')
  await applyReorder(footerLinks, footerLinks.id, ids)
}

// ---------------------------------------------------------------------------
// HOMEPAGE SECTIONS
// ---------------------------------------------------------------------------

export type HomepageSectionRow = typeof homepageSections.$inferSelect

export async function listHomepageSections(): Promise<HomepageSectionRow[]> {
  return getDb().select().from(homepageSections).orderBy(asc(homepageSections.sort_order))
}

export async function updateHomepageSectionVisibility(
  user: User,
  id: string,
  visible: boolean,
): Promise<HomepageSectionRow> {
  assertCan(user, 'settings.write')
  const [existing] = await getDb().select().from(homepageSections).where(eq(homepageSections.id, id)).limit(1)
  if (!existing) throw new SiteStructureError('القسم غير موجود', 404)
  const [row] = await getDb()
    .update(homepageSections)
    .set({ visible, updated_at: now() })
    .where(eq(homepageSections.id, id))
    .returning()
  return row
}

export async function reorderHomepageSections(user: User, ids: string[]): Promise<void> {
  assertCan(user, 'settings.write')
  await applyReorder(homepageSections, homepageSections.id, ids)
}

// ---------------------------------------------------------------------------
// DELIVERY ZONES
// ---------------------------------------------------------------------------

export type DeliveryZoneRow = typeof deliveryZones.$inferSelect

export async function listDeliveryZones(): Promise<DeliveryZoneRow[]> {
  return getDb().select().from(deliveryZones).orderBy(asc(deliveryZones.area_name))
}

export async function createDeliveryZone(
  user: User,
  input: { areaName: string; deliveryFee?: number; estimatedTime?: string; active?: boolean },
): Promise<DeliveryZoneRow> {
  assertCan(user, 'settings.write')
  const [row] = await getDb()
    .insert(deliveryZones)
    .values({
      id: crypto.randomUUID(),
      area_name: input.areaName,
      delivery_fee: input.deliveryFee ?? 0,
      estimated_time: input.estimatedTime ?? '',
      active: input.active ?? true,
      created_at: now(),
      updated_at: now(),
    })
    .returning()
  return row
}

export async function updateDeliveryZone(
  user: User,
  id: string,
  input: Partial<{ areaName: string; deliveryFee: number; estimatedTime: string; active: boolean }>,
): Promise<DeliveryZoneRow> {
  assertCan(user, 'settings.write')
  const [existing] = await getDb().select().from(deliveryZones).where(eq(deliveryZones.id, id)).limit(1)
  if (!existing) throw new SiteStructureError('المنطقة غير موجودة', 404)
  const [row] = await getDb()
    .update(deliveryZones)
    .set({ ...input, updated_at: now() })
    .where(eq(deliveryZones.id, id))
    .returning()
  return row
}

export async function deleteDeliveryZone(user: User, id: string): Promise<void> {
  assertCan(user, 'settings.write')
  await getDb().delete(deliveryZones).where(eq(deliveryZones.id, id))
}

// ---------------------------------------------------------------------------
// STATIC PAGES
// ---------------------------------------------------------------------------

export type StaticPageRow = typeof staticPages.$inferSelect

export async function listStaticPages(): Promise<StaticPageRow[]> {
  return getDb().select().from(staticPages).orderBy(asc(staticPages.title))
}

export async function getStaticPageBySlug(slug: string): Promise<StaticPageRow | null> {
  const [row] = await getDb().select().from(staticPages).where(eq(staticPages.slug, slug)).limit(1)
  return row ?? null
}

export async function createStaticPage(
  user: User,
  input: { slug: string; title: string; content: string; metaTitle?: string; metaDescription?: string; published?: boolean },
): Promise<StaticPageRow> {
  assertCan(user, 'settings.write')
  const [row] = await getDb()
    .insert(staticPages)
    .values({
      id: crypto.randomUUID(),
      slug: input.slug,
      title: input.title,
      content: input.content,
      meta_title: input.metaTitle ?? null,
      meta_description: input.metaDescription ?? null,
      published: input.published ?? false,
      created_at: now(),
      updated_at: now(),
    })
    .returning()
  return row
}

export async function updateStaticPage(
  user: User,
  id: string,
  input: Partial<{ slug: string; title: string; content: string; metaTitle?: string; metaDescription?: string; published?: boolean }>,
): Promise<StaticPageRow> {
  assertCan(user, 'settings.write')
  const [existing] = await getDb().select().from(staticPages).where(eq(staticPages.id, id)).limit(1)
  if (!existing) throw new SiteStructureError('الصفحة غير موجودة', 404)
  const [row] = await getDb()
    .update(staticPages)
    .set({ ...input, updated_at: now() })
    .where(eq(staticPages.id, id))
    .returning()
  return row
}

export async function deleteStaticPage(user: User, id: string): Promise<void> {
  assertCan(user, 'settings.write')
  await getDb().delete(staticPages).where(eq(staticPages.id, id))
}

// ---------------------------------------------------------------------------
// SEO SETTINGS
// ---------------------------------------------------------------------------

export type SeoSettingsRow = typeof seoSettings.$inferSelect

export async function listSeoSettings(): Promise<SeoSettingsRow[]> {
  return getDb().select().from(seoSettings).orderBy(asc(seoSettings.page_key))
}

export async function upsertSeoSettings(
  user: User,
  input: { pageKey: SeoPageKey; metaTitleTemplate: string; metaDescriptionTemplate: string; ogImageDefault?: string | null },
): Promise<SeoSettingsRow> {
  assertCan(user, 'settings.write')
  const [existing] = await getDb().select().from(seoSettings).where(eq(seoSettings.page_key, input.pageKey)).limit(1)
  if (existing) {
    const [row] = await getDb()
      .update(seoSettings)
      .set({
        meta_title_template: input.metaTitleTemplate,
        meta_description_template: input.metaDescriptionTemplate,
        og_image_default: input.ogImageDefault ?? null,
        updated_at: now(),
      })
      .where(eq(seoSettings.page_key, input.pageKey))
      .returning()
    return row
  }
  const [row] = await getDb()
    .insert(seoSettings)
    .values({
      id: crypto.randomUUID(),
      page_key: input.pageKey,
      meta_title_template: input.metaTitleTemplate,
      meta_description_template: input.metaDescriptionTemplate,
      og_image_default: input.ogImageDefault ?? null,
      created_at: now(),
      updated_at: now(),
    })
    .returning()
  return row
}

// ---------------------------------------------------------------------------
// Reorder helper (generic over any table with id + sort_order)
// ---------------------------------------------------------------------------

async function applyReorder(
  table: import('drizzle-orm').Table,
  idColumn: import('drizzle-orm').AnyColumn,
  ids: string[],
): Promise<void> {
  const db = getDb()
  for (let index = 0; index < ids.length; index += 1) {
    await db
      .update(table as never)
      .set({ sort_order: index } as never)
      .where(eq(idColumn as never, ids[index]))
  }
}

// ---------------------------------------------------------------------------
// Category dependency check (for safe delete)
// ---------------------------------------------------------------------------

export async function countCategoryProducts(categoryId: string): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.category_id, categoryId))
  return Number(row?.count ?? 0)
}
