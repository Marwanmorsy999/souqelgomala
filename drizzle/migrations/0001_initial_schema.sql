-- ============================================================
-- Souk El Gomla — D1 / SQLite Schema
-- Migration: 0001_initial_schema
--
-- Converted from the Supabase PostgreSQL schema to SQLite/D1.
-- Key differences from PostgreSQL:
--   - uuid → TEXT (app-generated UUID v4 strings)
--   - timestamptz → TEXT (ISO 8601 datetime strings)
--   - jsonb → TEXT (JSON serialized strings)
--   - PostgreSQL enums → TEXT with CHECK constraints
--   - uuid[] arrays → TEXT (JSON array serialized)
--   - gen_random_uuid() / sequences → handled in application layer
--   - RLS policies → removed (authorization at application/service layer)
--   - set_updated_at → SQLite trigger
--   - Order numbering → service-layer generation
--   - Customer metrics → service-layer recalculation
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- AUTH / USERS
-- ============================================================

CREATE TABLE roles (
  id                 TEXT PRIMARY KEY,  -- 'owner', 'manager', 'employee'
  label              TEXT NOT NULL,
  description        TEXT,
  permissions        TEXT NOT NULL,     -- JSON array of permission strings
  is_active          INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_roles_active ON roles(is_active);

CREATE TABLE profiles (
  id                 TEXT PRIMARY KEY,  -- UUID v4, app-generated
  email              TEXT UNIQUE,
  password_hash      TEXT,             -- null for SSO / invited users
  full_name          TEXT NOT NULL DEFAULT '',
  phone              TEXT,
  role               TEXT NOT NULL DEFAULT 'employee'
                      CHECK (role IN ('owner', 'manager', 'employee')),
  avatar             TEXT,
  branch_id          TEXT,             -- FK → branches.id
  is_active          INTEGER NOT NULL DEFAULT 1,
  last_login_at      TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT
);

CREATE INDEX idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_branch ON profiles(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_email ON profiles(email) WHERE deleted_at IS NULL;

CREATE TABLE sessions (
  id                 TEXT PRIMARY KEY,  -- opaque session token (hashed)
  profile_id         TEXT NOT NULL,
  session_token      TEXT NOT NULL UNIQUE,
  expires_at         TEXT NOT NULL,
  user_agent         TEXT,
  ip_address         TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_profile ON sessions(profile_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_token ON sessions(session_token);

CREATE TABLE auth_audit_logs (
  id                 TEXT PRIMARY KEY,
  profile_id         TEXT,
  action             TEXT NOT NULL,
  ip_address         TEXT,
  user_agent         TEXT,
  success            INTEGER NOT NULL DEFAULT 1,
  metadata           TEXT,             -- JSON
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- BRANCHES
-- ============================================================

CREATE TABLE branches (
  id                 TEXT PRIMARY KEY,
  name_ar            TEXT NOT NULL,
  name_en            TEXT,
  code               TEXT UNIQUE,
  address            TEXT,
  phone              TEXT,
  working_hours      TEXT,             -- JSON
  latitude           REAL,
  longitude          REAL,
  google_maps_url    TEXT,
  manager_id         TEXT,             -- FK → profiles.id
  is_active          INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

  FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_branches_code ON branches(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_branches_active ON branches(is_active) WHERE deleted_at IS NULL;

-- ============================================================
-- CATEGORIES (unlimited nesting)

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
  id                 TEXT PRIMARY KEY,
  barcode            TEXT UNIQUE,
  sku                TEXT UNIQUE,
  slug               TEXT,
  name_ar            TEXT NOT NULL,
  name_en            TEXT,
  description        TEXT,
  brand              TEXT,
  category_id        TEXT,             -- FK → categories.id
  price              REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
  offer_price        REAL CHECK (offer_price IS NULL OR offer_price < price),
  cost_price         REAL CHECK (cost_price IS NULL OR cost_price >= 0),
  unit               TEXT NOT NULL DEFAULT 'piece',
  weight             REAL,
  stock              INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock          INTEGER NOT NULL DEFAULT 10 CHECK (min_stock >= 0),
  is_featured        INTEGER NOT NULL DEFAULT 0,
  is_new_arrival     INTEGER NOT NULL DEFAULT 0,
  is_best_seller     INTEGER NOT NULL DEFAULT 0,
  is_visible         INTEGER NOT NULL DEFAULT 1,
  status             TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'inactive', 'archived')),
  display_order      INTEGER NOT NULL DEFAULT 0,
  image_alt          TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_brand ON products(brand) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_products_slug ON products(slug) WHERE slug IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_products_display_order ON products(display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_low_stock ON products(id) WHERE stock <= min_stock AND status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_products_featured ON products(id) WHERE is_featured = 1 AND is_visible = 1 AND deleted_at IS NULL;

CREATE TABLE product_images (
  id                 TEXT PRIMARY KEY,
  product_id         TEXT NOT NULL,
  url                TEXT NOT NULL,
  alt                TEXT,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_images_product ON product_images(product_id);


-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id                 TEXT PRIMARY KEY,
  phone              TEXT NOT NULL,
  name               TEXT,
  email              TEXT,
  total_spending     REAL NOT NULL DEFAULT 0,
  average_order      REAL NOT NULL DEFAULT 0,
  order_count        INTEGER NOT NULL DEFAULT 0,
  is_vip             INTEGER NOT NULL DEFAULT 0,
  is_blacklisted     INTEGER NOT NULL DEFAULT 0,
  notes              TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT
);

CREATE INDEX idx_customers_phone ON customers(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_vip ON customers(is_vip) WHERE deleted_at IS NULL;

CREATE TABLE customer_addresses (
  id                 TEXT PRIMARY KEY,
  customer_id        TEXT NOT NULL,
  label              TEXT,
  city               TEXT NOT NULL,
  address            TEXT NOT NULL,
  latitude           REAL,
  longitude          REAL,
  is_default         INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

-- ============================================================
-- ORDERS (Heart of the System)
-- ============================================================

CREATE TABLE orders (
  id                 TEXT PRIMARY KEY,
  order_number       TEXT NOT NULL UNIQUE,
  customer_id        TEXT,
  customer_name      TEXT,
  customer_phone     TEXT,
  customer_address   TEXT,
  branch_id          TEXT,
  status             TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'accepted', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled')),
  source             TEXT NOT NULL DEFAULT 'admin'
                      CHECK (source IN ('website', 'mobile', 'admin', 'whatsapp', 'facebook')),
  payment_status     TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method     TEXT
                      CHECK (payment_method IN ('cash', 'card', 'wallet', 'bank_transfer')),
  subtotal           REAL NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount           REAL NOT NULL DEFAULT 0 CHECK (discount >= 0),
  delivery_fee       REAL NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total              REAL NOT NULL DEFAULT 0 CHECK (total >= 0),
  driver_id          TEXT,
  assigned_driver_name TEXT,
  notes              TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE INDEX idx_orders_status ON orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_created ON orders(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_customer ON orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_driver ON orders(driver_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_branch ON orders(branch_id) WHERE deleted_at IS NULL;

CREATE TABLE order_items (
  id                 TEXT PRIMARY KEY,
  order_id           TEXT NOT NULL,
  product_id         TEXT,
  name_ar            TEXT NOT NULL,
  name_en            TEXT,
  quantity           INTEGER NOT NULL CHECK (quantity > 0),
  unit_price         REAL NOT NULL CHECK (unit_price >= 0),
  total              REAL NOT NULL CHECK (total >= 0),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE TABLE order_status_history (
  id                 TEXT PRIMARY KEY,
  order_id           TEXT NOT NULL,
  from_status        TEXT,
  to_status          TEXT NOT NULL,
  changed_by         TEXT,
  note               TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_order_history_order ON order_status_history(order_id, created_at);

CREATE TABLE order_timeline (
  id                 TEXT PRIMARY KEY,
  order_id           TEXT NOT NULL,
  type               TEXT NOT NULL,
  note               TEXT,
  actor_id           TEXT,
  metadata           TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_order_timeline_order ON order_timeline(order_id, created_at);

-- ============================================================
-- OFFERS & PROMOTIONS
-- ============================================================

CREATE TABLE offers (
  id                 TEXT PRIMARY KEY,
  banner             TEXT,
  campaign_name      TEXT NOT NULL,
  discount_type      TEXT NOT NULL
                      CHECK (discount_type IN ('percentage', 'fixed_price', 'buy_x_get_y')),
  value              REAL,
  buy_x              INTEGER,
  get_y              INTEGER,
  product_ids        TEXT NOT NULL DEFAULT '[]',

-- ============================================================
-- DELIVERY
-- ============================================================

CREATE TABLE delivery_drivers (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  phone              TEXT NOT NULL,
  vehicle            TEXT,
  branch_id          TEXT,
  status             TEXT NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available', 'busy', 'offline')),
  current_order_id   TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_delivery_drivers_branch ON delivery_drivers(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_delivery_drivers_status ON delivery_drivers(status) WHERE deleted_at IS NULL;

CREATE TABLE delivery_areas (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  city               TEXT NOT NULL,
  fee                REAL NOT NULL DEFAULT 0 CHECK (fee >= 0),
  min_order          REAL NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  is_active          INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT
);

CREATE INDEX idx_delivery_areas_city ON delivery_areas(city) WHERE deleted_at IS NULL;
CREATE INDEX idx_delivery_areas_active ON delivery_areas(is_active) WHERE deleted_at IS NULL;

CREATE TABLE delivery_assignments (
  id                 TEXT PRIMARY KEY,
  order_id           TEXT NOT NULL,
  driver_id          TEXT,
  assigned_by        TEXT,
  status             TEXT NOT NULL DEFAULT 'assigned'
                      CHECK (status IN ('assigned', 'picked_up', 'delivered', 'returned')),
  notes              TEXT,
  assigned_at        TEXT NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_driver ON delivery_assignments(driver_id);

-- ============================================================
-- OPERATIONS
-- ============================================================

CREATE TABLE activity_logs (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT,
  action             TEXT NOT NULL,
  entity             TEXT NOT NULL,
  entity_id          TEXT,
  metadata           TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity, entity_id);

CREATE TABLE notifications (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT,
  type               TEXT NOT NULL,
  title              TEXT NOT NULL,
  body               TEXT,
  severity           TEXT NOT NULL DEFAULT 'info'
                      CHECK (severity IN ('info', 'warning', 'error', 'success')),
  is_read            INTEGER NOT NULL DEFAULT 0,
  read_at            TEXT,
  entity             TEXT,
  entity_id          TEXT,
  metadata           TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

-- ============================================================
-- INVENTORY MOVEMENTS (immutable ledger)
-- ============================================================

CREATE TABLE inventory_movements (
  id                 TEXT PRIMARY KEY,
  product_id         TEXT NOT NULL,
  movement_type      TEXT NOT NULL
                      CHECK (movement_type IN ('purchase', 'sale', 'return', 'adjustment', 'transfer_in', 'transfer_out', 'initial_stock')),
  quantity           INTEGER NOT NULL,
  reason             TEXT,
  reference_type     TEXT,
  reference_id       TEXT,
  created_by         TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_ref ON inventory_movements(reference_type, reference_id);

-- ============================================================
-- SUPPLIERS & PURCHASE ORDERS (Foundation)
-- ============================================================

CREATE TABLE suppliers (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  phone              TEXT,
  email              TEXT,
  address            TEXT,
  tax_id             TEXT,
  payment_terms      TEXT,
  notes              TEXT,
  is_active          INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT
);

CREATE INDEX idx_suppliers_name ON suppliers(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_suppliers_tax_id ON suppliers(tax_id) WHERE tax_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE purchase_orders (
  id                 TEXT PRIMARY KEY,
  po_number          TEXT NOT NULL UNIQUE,
  supplier_id        TEXT,
  status             TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'ordered', 'partial', 'received', 'cancelled')),
  expected_date      TEXT,
  received_date      TEXT,
  subtotal           REAL NOT NULL DEFAULT 0,
  tax                REAL NOT NULL DEFAULT 0,
  discount           REAL NOT NULL DEFAULT 0,
  total              REAL NOT NULL DEFAULT 0,
  notes              TEXT,
  created_by         TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number) WHERE deleted_at IS NULL;

CREATE TABLE purchase_order_items (
  id                 TEXT PRIMARY KEY,

-- ============================================================
-- RETURNS (Foundation)
-- ============================================================

CREATE TABLE returns (
  id                 TEXT PRIMARY KEY,
  return_number      TEXT NOT NULL UNIQUE,
  order_id           TEXT,
  customer_id        TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reason             TEXT,
  total_refund       REAL NOT NULL DEFAULT 0,
  created_by         TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_returns_order ON returns(order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_returns_customer ON returns(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_returns_status ON returns(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_returns_return_number ON returns(return_number) WHERE deleted_at IS NULL;

CREATE TABLE return_items (
  id                 TEXT PRIMARY KEY,
  return_id          TEXT NOT NULL,
  product_id         TEXT,
  quantity           INTEGER NOT NULL,
  unit_price         REAL NOT NULL,
  total              REAL NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX idx_return_items_return ON return_items(return_id);
CREATE INDEX idx_return_items_product ON return_items(product_id);

-- ============================================================
-- FEATURE FLAGS & GROUPS
-- ============================================================

CREATE TABLE feature_groups (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL UNIQUE,
  description        TEXT,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  is_active          INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT
);

CREATE INDEX idx_feature_groups_active ON feature_groups(is_active) WHERE deleted_at IS NULL;

CREATE TABLE feature_flags (
  id                 TEXT PRIMARY KEY,
  key                TEXT NOT NULL UNIQUE,
  group_id           TEXT,

-- ============================================================
-- TRIGGERS: auto-update updated_at (replaces PostgreSQL set_updated_at function)
-- Only fires when the row's updated_at is NOT explicitly changed (i.e. NOT changed
-- by the application layer, which sets updated_at explicitly on writes).
-- ============================================================

CREATE TRIGGER trg_branches_updated_at
  AFTER UPDATE ON branches
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE branches SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_profiles_updated_at
  AFTER UPDATE ON profiles
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE profiles SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_categories_updated_at
  AFTER UPDATE ON categories
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE categories SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_products_updated_at
  AFTER UPDATE ON products
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_customers_updated_at
  AFTER UPDATE ON customers
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE customers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_customer_addresses_updated_at
  AFTER UPDATE ON customer_addresses
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE customer_addresses SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_orders_updated_at
  AFTER UPDATE ON orders
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE orders SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_offers_updated_at
  AFTER UPDATE ON offers
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE offers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_delivery_drivers_updated_at
  AFTER UPDATE ON delivery_drivers
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE delivery_drivers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_delivery_areas_updated_at
  AFTER UPDATE ON delivery_areas
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE delivery_areas SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_settings_updated_at
  AFTER UPDATE ON settings
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_feature_groups_updated_at
  AFTER UPDATE ON feature_groups
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE feature_groups SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_feature_flags_updated_at
  AFTER UPDATE ON feature_flags
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE feature_flags SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_purchase_orders_updated_at
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE purchase_orders SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_returns_updated_at
  AFTER UPDATE ON returns
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE returns SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_suppliers_updated_at
  AFTER UPDATE ON suppliers
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE suppliers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_return_items_updated_at
  AFTER UPDATE ON return_items
  FOR EACH ROW WHEN NEW.updated_at IS NOT changed
BEGIN
  UPDATE return_items SET deleted_at = datetime('now') WHERE deleted_at IS NULL AND id = NEW.id;
END;

  label              TEXT NOT NULL,
  description        TEXT,
  is_enabled         INTEGER NOT NULL DEFAULT 0,
  value              TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

  FOREIGN KEY (group_id) REFERENCES feature_groups(id) ON DELETE SET NULL
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key) WHERE deleted_at IS NULL;
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled) WHERE deleted_at IS NULL;

  purchase_order_id  TEXT NOT NULL,
  product_id         TEXT,
  quantity           INTEGER NOT NULL,
  unit_cost          REAL NOT NULL,
  total              REAL NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);


  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE TABLE settings (
  id                 TEXT PRIMARY KEY,
  key                TEXT NOT NULL UNIQUE,
  value              TEXT NOT NULL,
  description        TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_settings_key ON settings(key);

  start_date         TEXT NOT NULL,
  end_date           TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('active', 'inactive', 'scheduled', 'expired')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT
);

CREATE INDEX idx_offers_status ON offers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_offers_dates ON offers(start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_offers_active ON offers(id) WHERE status = 'active' AND start_date <= datetime('now') AND end_date >= datetime('now') AND deleted_at IS NULL;

CREATE INDEX idx_orders_order_number ON orders(order_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_updated ON orders(updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_source ON orders(source) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_payment_status ON orders(payment_status) WHERE deleted_at IS NULL;


  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_addresses_default ON customer_addresses(is_default) WHERE deleted_at IS NULL;

CREATE TABLE product_tags (
  id                 TEXT PRIMARY KEY,
  product_id         TEXT NOT NULL,
  tag                TEXT NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_tags_product ON product_tags(product_id);

-- ============================================================

CREATE TABLE categories (
  id                 TEXT PRIMARY KEY,
  name_ar            TEXT NOT NULL,
  name_en            TEXT,
  parent_id          TEXT,             -- self-reference
  image              TEXT,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  is_visible         INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at         TEXT,

  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_parent ON categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_visible ON categories(is_visible) WHERE deleted_at IS NULL;
