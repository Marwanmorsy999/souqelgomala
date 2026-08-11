/**
 * Drizzle schema: Site Structure (nav, footer, homepage sections, delivery zones,
 * static pages, SEO settings)
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export type LinkTarget = 'internal' | 'external'
export type FooterSection = 'quick_links' | 'contact' | 'social'
export type HomepageSectionKey =
  | 'hero'
  | 'deals_strip'
  | 'categories'
  | 'products'
  | 'social_strip'
export type SeoPageKey = 'homepage' | 'category' | 'product'

// ---------------------------------------------------------------------------
// Site settings — single business-config row (general info + delivery config).
// Flat columns (not key/value) so every field is directly queryable and the
// storefront can render real defaults when the row is absent.
// ---------------------------------------------------------------------------
export const siteSettings = sqliteTable(
  'site_settings',
  {
    id: text('id').primaryKey(),
    business_name: text('business_name').notNull().default('سوق الجملة'),
    logo_url: text('logo_url'),
    phone_primary: text('phone_primary'),
    phone_secondary: text('phone_secondary'),
    address: text('address'),
    whatsapp_number: text('whatsapp_number'),
    facebook_url: text('facebook_url'),
    instagram_url: text('instagram_url'),
    tiktok_url: text('tiktok_url'),
    min_order_value: real('min_order_value').notNull().default(0),
    free_delivery_threshold: real('free_delivery_threshold').notNull().default(0),
    default_delivery_fee: real('default_delivery_fee').notNull().default(0),
    updated_by: text('updated_by'),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_site_settings_id: index('idx_site_settings_id').on(table.id),
  })
)

// ---------------------------------------------------------------------------
// Navigation links (admin-managed, replaces hardcoded Header nav)
// ---------------------------------------------------------------------------
export const navLinks = sqliteTable(
  'nav_links',
  {
    id: text('id').primaryKey(),
    label: text('label').notNull(),
    url: text('url').notNull(),
    sort_order: integer('sort_order').notNull().default(0),
    visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
    target: text('target').$type<LinkTarget>().notNull().default('internal'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_nav_links_visible: index('idx_nav_links_visible').on(table.visible),
    idx_nav_links_order: index('idx_nav_links_order').on(table.sort_order),
  })
)

// ---------------------------------------------------------------------------
// Footer links (three sections: quick_links, contact, social)
// ---------------------------------------------------------------------------
export const footerLinks = sqliteTable(
  'footer_links',
  {
    id: text('id').primaryKey(),
    section: text('section').$type<FooterSection>().notNull(),
    label: text('label').notNull(),
    url: text('url').notNull(),
    sort_order: integer('sort_order').notNull().default(0),
    visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_footer_links_section: index('idx_footer_links_section').on(table.section),
    idx_footer_links_visible: index('idx_footer_links_visible').on(table.visible),
    idx_footer_links_order: index('idx_footer_links_order').on(table.sort_order),
  })
)

// ---------------------------------------------------------------------------
// Homepage sections — controls which sections render and in what order
// ---------------------------------------------------------------------------
export const homepageSections = sqliteTable(
  'homepage_sections',
  {
    id: text('id').primaryKey(),
    section_key: text('section_key').$type<HomepageSectionKey>().notNull().unique(),
    visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
    sort_order: integer('sort_order').notNull().default(0),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_homepage_sections_key: index('idx_homepage_sections_key').on(
      table.section_key
    ),
    idx_homepage_sections_visible: index('idx_homepage_sections_visible').on(
      table.visible
    ),
    idx_homepage_sections_order: index('idx_homepage_sections_order').on(
      table.sort_order
    ),
  })
)

// ---------------------------------------------------------------------------
// Delivery zones (admin-managed; used at checkout / WhatsApp order builder)
// ---------------------------------------------------------------------------
export const deliveryZones = sqliteTable(
  'delivery_zones',
  {
    id: text('id').primaryKey(),
    area_name: text('area_name').notNull(),
    delivery_fee: real('delivery_fee').notNull().default(0),
    estimated_time: text('estimated_time').notNull().default(''),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_delivery_zones_active: index('idx_delivery_zones_active').on(table.active),
  })
)

// ---------------------------------------------------------------------------
// Static pages (rich text / markdown, rendered at /:slug on the storefront)
// ---------------------------------------------------------------------------
export const staticPages = sqliteTable(
  'static_pages',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull(), // rich text / markdown
    meta_title: text('meta_title'),
    meta_description: text('meta_description'),
    published: integer('published', { mode: 'boolean' }).notNull().default(false),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_static_pages_slug: index('idx_static_pages_slug').on(table.slug),
    idx_static_pages_published: index('idx_static_pages_published').on(
      table.published
    ),
  })
)

// ---------------------------------------------------------------------------
// SEO settings (per page-type templates)
// ---------------------------------------------------------------------------
export const seoSettings = sqliteTable(
  'seo_settings',
  {
    id: text('id').primaryKey(),
    page_key: text('page_key').$type<SeoPageKey>().notNull().unique(),
    meta_title_template: text('meta_title_template').notNull(),
    meta_description_template: text('meta_description_template').notNull(),
    og_image_default: text('og_image_default'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_seo_settings_page_key: index('idx_seo_settings_page_key').on(
      table.page_key
    ),
  })
)
