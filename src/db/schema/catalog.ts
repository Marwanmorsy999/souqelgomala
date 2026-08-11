/**
 * Drizzle schema: Catalog (categories, products, images, tags)
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export const ProductStatus = ['active', 'inactive', 'archived'] as const
export type ProductStatus = (typeof ProductStatus)[number]
export type PublishStatus = 'draft' | 'published'

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    name_ar: text('name_ar').notNull(),
    name_en: text('name_en'),
    parent_id: text('parent_id'), // self-reference
    image: text('image'),
    icon_url: text('icon_url'),
    sort_order: integer('sort_order').notNull().default(0),
    is_visible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_categories_parent: index('idx_categories_parent').on(table.parent_id),
    idx_categories_visible: index('idx_categories_visible').on(table.is_visible),
  })
)

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    barcode: text('barcode'),
    sku: text('sku'),
    slug: text('slug'),
    name_ar: text('name_ar').notNull(),
    name_en: text('name_en'),
    description: text('description'),
    brand: text('brand'),
    category_id: text('category_id'),
    price: real('price').notNull().default(0), // retail
    offer_price: real('offer_price'), // promotional price
    wholesale_price: real('wholesale_price'), // wholesale price
    compare_at_price: real('compare_at_price'), // original/comparison price
    cost_price: real('cost_price'),
    unit: text('unit').notNull().default('piece'),
    weight: real('weight'),
    stock: integer('stock').notNull().default(0),
    min_stock: integer('min_stock').notNull().default(10),
    low_stock_threshold: integer('low_stock_threshold').notNull().default(5),
    is_featured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
    is_new_arrival: integer('is_new_arrival', { mode: 'boolean' }).notNull().default(false),
    is_best_seller: integer('is_best_seller', { mode: 'boolean' }).notNull().default(false),
    is_visible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    status: text('status').$type<ProductStatus>().notNull().default('active'),
    publish_status: text('publish_status').$type<PublishStatus>().notNull().default('published'), // 'draft' | 'published'
    display_order: integer('display_order').notNull().default(0),
    image_alt: text('image_alt'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_products_category: index('idx_products_category').on(table.category_id),
    idx_products_barcode: index('idx_products_barcode').on(table.barcode),
    idx_products_sku: index('idx_products_sku').on(table.sku),
    idx_products_status: index('idx_products_status').on(table.status),
    idx_products_publish: index('idx_products_publish').on(table.publish_status),
    idx_products_stock: index('idx_products_stock').on(table.stock),
    idx_products_brand: index('idx_products_brand').on(table.brand),
    idx_products_slug: index('idx_products_slug').on(table.slug),
    idx_products_display_order: index('idx_products_display_order').on(table.display_order),
    idx_products_low_stock: index('idx_products_low_stock').on(table.id),
    idx_products_featured: index('idx_products_featured').on(table.id),
  })
)

/**
 * Product media — Cloudinary-backed.
 *
 * D1 stores only Cloudinary metadata (public_id, delivery hints, alt, order).
 * The actual binary image data lives in Cloudinary (public storefront media).
 * A product may have MULTIPLE media rows; `is_primary` marks the primary image.
 */
export type MediaResourceType = 'image' | 'video' | 'auto'

export const productMedia = sqliteTable(
  'product_media',
  {
    id: text('id').primaryKey(),
    product_id: text('product_id').notNull(),
    cloudinary_public_id: text('cloudinary_public_id').notNull(),
    secure_url: text('secure_url').notNull(),
    width: integer('width'),
    height: integer('height'),
    format: text('format'),
    resource_type: text('resource_type').$type<MediaResourceType>().notNull().default('image'),
    alt: text('alt'),
    display_order: integer('display_order').notNull().default(0),
    is_primary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_product_media_product: index('idx_product_media_product').on(table.product_id),
    idx_product_media_primary: index('idx_product_media_primary').on(table.product_id, table.is_primary),
  })
)

/** Category media — Cloudinary-backed (square thumbnails for the storefront). */
export const categoryMedia = sqliteTable(
  'category_media',
  {
    id: text('id').primaryKey(),
    category_id: text('category_id').notNull(),
    cloudinary_public_id: text('cloudinary_public_id').notNull(),
    secure_url: text('secure_url').notNull(),
    width: integer('width'),
    height: integer('height'),
    format: text('format'),
    resource_type: text('resource_type').$type<MediaResourceType>().notNull().default('image'),
    alt: text('alt'),
    display_order: integer('display_order').notNull().default(0),
    is_primary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),
  },
  (table) => ({
    idx_category_media_category: index('idx_category_media_category').on(table.category_id),
    idx_category_media_primary: index('idx_category_media_primary').on(table.category_id, table.is_primary),
  })
)

export const productTags = sqliteTable(
  'product_tags',
  {
    id: text('id').primaryKey(),
    product_id: text('product_id').notNull(),
    tag: text('tag').notNull(),
    created_at: text('created_at').notNull(),
  },
  (table) => ({
    idx_product_tags_product: index('idx_product_tags_product').on(table.product_id),
  })
)
