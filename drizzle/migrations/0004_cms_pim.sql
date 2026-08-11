-- ============================================================
-- Souk El Gomla — CMS + PIM System (Promos, Media, Deals, Imports, Staff)
-- Migration: 0004_cms_pim
-- ============================================================

PRAGMA foreign_keys = OFF;

-- PRODUCTS: add low_stock_threshold + publish_status
ALTER TABLE products ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 5;
ALTER TABLE products ADD COLUMN publish_status text NOT NULL DEFAULT 'published';

-- PROMO SLOTS
CREATE TABLE promo_slots (
  id text PRIMARY KEY NOT NULL,
  placement text NOT NULL,
  category_id text,
  image_url text NOT NULL,
  title text NOT NULL,
  subtitle text,
  cta_text text,
  cta_link text,
  start_at text NOT NULL,
  end_at text NOT NULL,
  active integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  publish_status text NOT NULL DEFAULT 'published',
  frequency text NOT NULL DEFAULT 'every_visit',
  created_by text,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  deleted_at text
);
CREATE INDEX idx_promo_placement ON promo_slots(placement);
CREATE INDEX idx_promo_active ON promo_slots(active);
CREATE INDEX idx_promo_dates ON promo_slots(start_at, end_at);
CREATE INDEX idx_promo_category ON promo_slots(category_id);

-- MEDIA LIBRARY
CREATE TABLE media_library (
  id text PRIMARY KEY NOT NULL,
  url text NOT NULL,
  cloudinary_public_id text NOT NULL,
  filename text NOT NULL,
  alt_text text,
  tags text NOT NULL DEFAULT '[]',
  width integer,
  height integer,
  format text,
  resource_type text NOT NULL DEFAULT 'image',
  uploaded_by text,
  uploaded_at text NOT NULL,
  usage_count integer NOT NULL DEFAULT 0
);
CREATE INDEX idx_media_public_id ON media_library(cloudinary_public_id);
CREATE INDEX idx_media_filename ON media_library(filename);
CREATE INDEX idx_media_uploaded ON media_library(uploaded_at);

-- DEAL HISTORY
CREATE TABLE deal_history (
  id text PRIMARY KEY NOT NULL,
  product_id text NOT NULL,
  discount_pct integer,
  fixed_discount real,
  start_at text NOT NULL,
  end_at text NOT NULL,
  created_by text,
  created_at text NOT NULL
);
CREATE INDEX idx_deal_product ON deal_history(product_id);
CREATE INDEX idx_deal_dates ON deal_history(start_at, end_at);

-- IMPORT JOBS
CREATE TABLE import_jobs (
  id text PRIMARY KEY NOT NULL,
  type text NOT NULL,
  filename text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  row_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  error_log text,
  uploaded_by text,
  created_at text NOT NULL
);
CREATE INDEX idx_import_status ON import_jobs(status);
CREATE INDEX idx_import_created ON import_jobs(created_at);

-- STAFF PERMISSIONS
CREATE TABLE staff_permissions (
  staff_id text PRIMARY KEY NOT NULL,
  can_edit_products integer NOT NULL DEFAULT 1,
  can_edit_prices integer NOT NULL DEFAULT 1,
  can_edit_promos integer NOT NULL DEFAULT 1,
  can_manage_staff integer NOT NULL DEFAULT 0,
  can_view_reports integer NOT NULL DEFAULT 1,
  updated_at text NOT NULL
);
CREATE INDEX idx_staff_perm ON staff_permissions(staff_id);

-- MEDIA-PRODUCT JOIN (for bulk image match)
CREATE TABLE media_product (
  id text PRIMARY KEY NOT NULL,
  media_id text NOT NULL,
  product_id text NOT NULL,
  created_at text NOT NULL
);
CREATE INDEX idx_media_product_media ON media_product(media_id);
CREATE INDEX idx_media_product_product ON media_product(product_id);

-- PRODUCT SOURCE (for PDF imports)
ALTER TABLE products ADD COLUMN source text;

PRAGMA foreign_keys = ON;
