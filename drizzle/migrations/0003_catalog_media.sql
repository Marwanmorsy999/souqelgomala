-- ============================================================
-- Souk El Gomla — D1 / SQLite Schema
-- Migration: 0003_catalog_media
--
-- Milestone 4: Production catalog + Cloudinary media.
--
-- Adds:
--   1. products.wholesale_price  (wholesale/retail split)
--   2. products.compare_at_price (original/comparison price for discount badges)
--   3. product_media             (Cloudinary-backed, MULTIPLE images per product)
--   4. category_media            (Cloudinary-backed category thumbnails)
--
-- D1 stores ONLY Cloudinary metadata (public_id, secure_url, delivery hints).
-- The actual binary image data lives in Cloudinary (public storefront media).
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- PRODUCT PRICE COLUMNS
-- ============================================================

-- wholesale_price: the wholesale (jomla) selling price. Nullable.
ALTER TABLE products ADD COLUMN wholesale_price REAL;

-- compare_at_price: the original/higher price shown as strikethrough. Nullable.
ALTER TABLE products ADD COLUMN compare_at_price REAL;

-- Rebuild the featured index to include the new price columns' queries if needed
-- (the existing indexes remain valid; no drop required for additive columns).

-- ============================================================
-- PRODUCT MEDIA (Cloudinary-backed)
-- ============================================================

CREATE TABLE product_media (
  id                     TEXT PRIMARY KEY,
  product_id             TEXT NOT NULL,
  cloudinary_public_id   TEXT NOT NULL,
  secure_url             TEXT NOT NULL,
  width                  INTEGER,
  height                 INTEGER,
  format                 TEXT,
  resource_type          TEXT NOT NULL DEFAULT 'image'
                         CHECK (resource_type IN ('image', 'video', 'auto')),
  alt                    TEXT,
  display_order          INTEGER NOT NULL DEFAULT 0,
  is_primary             INTEGER NOT NULL DEFAULT 0,
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at             TEXT,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_media_product ON product_media(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_media_primary ON product_media(product_id, is_primary) WHERE deleted_at IS NULL;

-- ============================================================
-- CATEGORY MEDIA (Cloudinary-backed)
-- ============================================================

CREATE TABLE category_media (
  id                     TEXT PRIMARY KEY,
  category_id            TEXT NOT NULL,
  cloudinary_public_id   TEXT NOT NULL,
  secure_url             TEXT NOT NULL,
  width                  INTEGER,
  height                 INTEGER,
  format                 TEXT,
  resource_type          TEXT NOT NULL DEFAULT 'image'
                         CHECK (resource_type IN ('image', 'video', 'auto')),
  alt                    TEXT,
  display_order          INTEGER NOT NULL DEFAULT 0,
  is_primary             INTEGER NOT NULL DEFAULT 0,
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at             TEXT,

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_category_media_category ON category_media(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_category_media_primary ON category_media(category_id, is_primary) WHERE deleted_at IS NULL;

-- ============================================================
-- TRIGGERS: auto-update updated_at for the new media tables
-- ============================================================

CREATE TRIGGER trg_product_media_updated_at
  AFTER UPDATE ON product_media
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE product_media SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_category_media_updated_at
  AFTER UPDATE ON category_media
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE category_media SET updated_at = datetime('now') WHERE id = NEW.id;
END;
