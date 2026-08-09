-- ============================================================
-- Souk El Gomla — Seed Data (D1 / SQLite)
-- Migration: 0002_seed_data
-- ============================================================

PRAGMA foreign_keys = OFF;

-- ROLES
INSERT OR IGNORE INTO roles (id, label, description, permissions, is_active, created_at, updated_at)
VALUES
  ('owner', 'مالك', 'Full access to all resources',
   '["dashboard.read","orders.read","orders.update","orders.assign_driver","products.read","products.write","categories.read","categories.write","customers.read","customers.write","offers.read","offers.write","delivery.read","delivery.write","branches.read","branches.write","employees.read","employees.write","reports.read","settings.read","settings.write","settings.manage","suppliers.read","suppliers.write","purchase_orders.read","purchase_orders.write","inventory.read","inventory.write","returns.read","returns.write","feature_flags.read","feature_flags.write"]',
   1, datetime('now'), datetime('now')),
  ('manager', 'مدير', 'Can manage most resources',
   '["dashboard.read","orders.read","orders.update","orders.assign_driver","products.read","products.write","categories.read","categories.write","customers.read","customers.write","offers.read","offers.write","delivery.read","delivery.write","branches.read","reports.read","settings.read","settings.write","suppliers.read","suppliers.write","purchase_orders.read","purchase_orders.write","inventory.read","inventory.write","returns.read","returns.write"]',
   1, datetime('now'), datetime('now')),
  ('employee', 'موظف', 'Read-only access plus limited order updates',
   '["dashboard.read","orders.read","orders.update","products.read","categories.read","customers.read","delivery.read","reports.read","inventory.read","returns.read"]',
   1, datetime('now'), datetime('now'));

-- BRANCHES
INSERT OR IGNORE INTO branches (id, name_ar, name_en, code, address, phone, working_hours, latitude, longitude, google_maps_url, manager_id, is_active, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'سوق الجملة - فرع الدقي', 'Souk El Gomla - Dokki', 'DOK', 'شارع التحرير، الدقي، الجيزة', '01012345678',
   '{"saturday": {"open": "09:00", "close": "23:00"}, "sunday": {"open": "09:00", "close": "23:00"}, "monday": {"open": "09:00", "close": "23:00"}, "tuesday": {"open": "09:00", "close": "23:00"}, "wednesday": {"open": "09:00", "close": "23:00"}, "thursday": {"open": "09:00", "close": "23:00"}, "friday": {"open": "13:00", "close": "23:00"}}',
   30.0328, 31.2077, 'https://maps.google.com/?q=Dokki,Giza', NULL, 1, datetime('now'), datetime('now'));

-- PROFILES (seed admin — password_hash NULL; set via auth flow)
INSERT OR IGNORE INTO profiles (id, email, password_hash, full_name, phone, role, avatar, branch_id, is_active, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin@soukelgomla.com', NULL, 'مدير النظام', '01012345678', 'owner', NULL, '00000000-0000-0000-0000-000000000001', 1, datetime('now'), datetime('now'));

-- CATEGORIES
INSERT OR IGNORE INTO categories (id, name_ar, name_en, parent_id, sort_order, is_visible, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'بقالة', 'Grocery', NULL, 1, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000002', 'ألبان', 'Dairy', NULL, 2, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000003', 'مشروبات', 'Beverages', NULL, 3, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000004', 'مجمدات', 'Frozen', NULL, 4, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000005', 'تنظيف', 'Cleaning', NULL, 5, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000006', 'عناية شخصية', 'Personal Care', NULL, 6, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000007', 'أطفال', 'Baby', NULL, 7, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000010', 'أرز ومكرونة', 'Rice & Pasta', '10000000-0000-0000-0000-000000000001', 1, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000011', 'زيوت وسمن', 'Oils & Ghee', '10000000-0000-0000-0000-000000000001', 2, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000012', 'سكر وملح', 'Sugar & Salt', '10000000-0000-0000-0000-000000000001', 3, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000020', 'أجبان', 'Cheese', '10000000-0000-0000-0000-000000000002', 1, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000021', 'زبدة وسمنة', 'Butter & Ghee', '10000000-0000-0000-0000-000000000002', 2, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000030', 'شاي وقهوة', 'Tea & Coffee', '10000000-0000-0000-0000-000000000003', 1, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000031', 'عصائر', 'Juices', '10000000-0000-0000-0000-000000000003', 2, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000032', 'مياه', 'Water', '10000000-0000-0000-0000-000000000003', 3, 1, datetime('now'), datetime('now'));

-- FEATURE GROUPS & FLAGS
INSERT OR IGNORE INTO feature_groups (id, name, description, sort_order, is_active, created_at, updated_at)
VALUES
  ('fgrp-customer', 'customer', 'Customer-facing features', 1, 1, datetime('now'), datetime('now')),
  ('fgrp-marketing', 'marketing', 'Marketing and promotions', 2, 1, datetime('now'), datetime('now')),
  ('fgrp-operations', 'operations', 'Back-office operations', 3, 1, datetime('now'), datetime('now')),
  ('fgrp-ai', 'ai', 'AI assistant features', 4, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO feature_flags (id, key, group_id, label, description, is_enabled, value, created_at, updated_at)
VALUES
  ('ff-wishlist', 'wishlist', 'fgrp-customer', 'قائمة الرغبات', 'Wishlist feature', 0, '{}', datetime('now'), datetime('now')),
  ('ff-reviews', 'reviews', 'fgrp-customer', 'التقييمات', 'Product reviews and ratings', 0, '{}', datetime('now'), datetime('now')),
  ('ff-loyalty', 'loyalty', 'fgrp-marketing', 'برنامج الولاء', 'Loyalty points program', 0, '{}', datetime('now'), datetime('now')),
  ('ff-coupons', 'coupons', 'fgrp-marketing', 'الكوبونات', 'Coupons and promo codes', 0, '{}', datetime('now'), datetime('now')),
  ('ff-inventory', 'inventory', 'fgrp-operations', 'المخزون', 'Inventory management module', 1, '{}', datetime('now'), datetime('now')),
  ('ff-suppliers', 'suppliers', 'fgrp-operations', 'الموردين', 'Supplier management module', 1, '{}', datetime('now'), datetime('now')),
  ('ff-purchase_orders', 'purchase_orders', 'fgrp-operations', 'أوامر الشراء', 'Purchase orders module', 1, '{}', datetime('now'), datetime('now')),
  ('ff-returns', 'returns', 'fgrp-operations', 'المرتجعات', 'Returns management module', 1, '{}', datetime('now'), datetime('now')),
  ('ff-ai_assistant', 'ai_assistant', 'fgrp-ai', 'المساعد الذكي', 'AI assistant features', 0, '{}', datetime('now'), datetime('now'));

-- SETTINGS
INSERT OR IGNORE INTO settings (id, key, value, description, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'store.name_ar', '{"value": "سوق الجملة"}', 'اسم المتجر بالعربية', datetime('now'), datetime('now')),
  ('00000000-0000-0000-0000-000000000003', 'store.name_en', '{"value": "Souk El Gomla"}', 'اسم المتجر بالإنجليزية', datetime('now'), datetime('now')),
  ('00000000-0000-0000-0000-000000000004', 'store.phone', '{"value": "01012345678"}', 'رقم الهاتف', datetime('now'), datetime('now')),
  ('00000000-0000-0000-0000-000000000005', 'store.email', '{"value": "info@soukelgomla.com"}', 'البريد الإلكتروني', datetime('now'), datetime('now')),
  ('00000000-0000-0000-0000-000000000006', 'store.currency', '{"value": "EGP"}', 'العملة', datetime('now'), datetime('now')),
  ('00000000-0000-0000-0000-000000000007', 'store.invoice_prefix', '{"value": "SG"}', 'بادئة رقم الفاتورة', datetime('now'), datetime('now')),
  ('00000000-0000-0000-0000-000000000008', 'store.tax_percent', '{"value": 14}', 'نسبة الضريبة المضافة', datetime('now'), datetime('now')),
  ('00000000-0000-0000-0000-000000000009', 'delivery.default_fee', '{"value": 25}', 'رسوم التوصيل الافتراضية', datetime('now'), datetime('now')),
  ('00000000-0000-0000-0000-000000000010', 'delivery.free_threshold', '{"value": 300}', 'حد التوصيل المجاني', datetime('now'), datetime('now'));

-- PRODUCTS
INSERT OR IGNORE INTO products (id, barcode, sku, slug, name_ar, name_en, description, brand, category_id, price, offer_price, cost_price, unit, weight, stock, min_stock, display_order, image_alt, is_featured, is_new_arrival, is_best_seller, is_visible, status, created_at, updated_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '6221000110011', 'SKU-SUG-001', 'sugar', 'سكر', 'White Sugar', 'سكر أبيض ناعم 1 كيلو', NULL, '10000000-0000-0000-0000-000000000001', 27, NULL, 18, 'كيلو', 1, 120, 50, 1, NULL, 1, 1, 0, 1, 'active', datetime('now'), datetime('now')),
  ('20000000-0000-0000-0000-000000000002', '6221000110012', 'SKU-OIL-001', 'sunflower-oil', 'زيت عباد الشمس', 'Sunflower Oil', 'زيت نباتي 1.8 لتر', NULL, '10000000-0000-0000-0000-000000000001', 72, NULL, 48, 'زجة 1.8 لتر', 1.8, 80, 30, 2, NULL, 0, 1, 1, 1, 'active', datetime('now'), datetime('now')),
  ('20000000-0000-0000-0000-000000000003', '6221000110013', 'SKU-RIC-001', 'basmati-rice', 'أرز بسمتي', 'Basmati Rice', 'أرز بسمتي طويل الحبوات', NULL, '10000000-0000-0000-0000-000000000010', 35, 30, 22, 'كيلو', 1, 60, 20, 3, NULL, 1, 1, 1, 1, 'active', datetime('now'), datetime('now')),
  ('20000000-0000-0000-0000-000000000004', '6221000110014', 'SKU-MOZ-001', 'mozzarella', 'موتزريلا', 'Mozzarella', 'موتزريلا طازجة 500 جرام', NULL, '10000000-0000-0000-0000-000000000020', 85, NULL, 55, '500 جرام', 0.5, 45, 15, 4, NULL, 0, 1, 0, 1, 'active', datetime('now'), datetime('now')),
  ('20000000-0000-0000-0000-000000000005', '6221000110015', 'SKU-PAS-001', 'pasta', 'مكرونة', 'Pasta', 'مكرونة إيطالية 500 جرام', NULL, '10000000-0000-0000-0000-000000000010', 18, NULL, 12, '500 جرام', 0.5, 30, 20, 5, NULL, 0, 1, 0, 1, 'active', datetime('now'), datetime('now')),
  ('20000000-0000-0000-0000-000000000006', '6221000110016', 'SKU-CHS-001', 'white-cheese', 'جبنة بيضاء', 'White Cheese', 'جبنة بيضاء 500 جرام', NULL, '10000000-0000-0000-0000-000000000020', 55, NULL, 35, '500 جرام', 0.5, 40, 15, 6, NULL, 0, 1, 0, 1, 'active', datetime('now'), datetime('now')),
  ('20000000-0000-0000-0000-000000000007', '6221000110017', 'SKU-BUT-001', 'butter', 'زبدة', 'Butter', 'زبدة طازجة 250 جرام', NULL, '10000000-0000-0000-0000-000000000021', 42, NULL, 28, '250 جرام', 0.25, 50, 10, 7, NULL, 0, 1, 0, 1, 'active', datetime('now'), datetime('now')),
  ('20000000-0000-0000-0000-000000000008', '6221000110018', 'SKU-TEA-001', 'lipton-tea', 'شاي ليبتون', 'Lipton Tea', 'شاي أحمر ليبتون 100 كيس', NULL, '10000000-0000-0000-0000-000000000030', 68, NULL, 45, '100 كيس', 1, 35, 10, 8, NULL, 0, 1, 0, 1, 'active', datetime('now'), datetime('now'));

-- OFFERS
INSERT OR IGNORE INTO offers (id, banner, campaign_name, discount_type, value, buy_x, get_y, product_ids, start_date, end_date, status, created_at, updated_at)
VALUES
  ('60000000-0000-0000-0000-000000000001', NULL, 'خصم 10% على الأرز', 'percentage', 10, NULL, NULL, '["20000000-0000-0000-0000-000000000003"]', datetime('now', '-7 days'), datetime('now', '+7 days'), 'active', datetime('now'), datetime('now')),
  ('60000000-0000-0000-0000-000000000002', NULL, 'اشترِ 2 شاي احصل على 1', 'buy_x_get_y', NULL, 2, 1, '["20000000-0000-0000-0000-000000000008"]', datetime('now', '-3 days'), datetime('now', '+4 days'), 'active', datetime('now'), datetime('now')),
  ('60000000-0000-0000-0000-000000000003', NULL, 'عرض العودة للمدارس', 'fixed_price', 500, NULL, NULL, '["20000000-0000-0000-0000-000000000005"]', datetime('now', '+7 days'), datetime('now', '+30 days'), 'scheduled', datetime('now'), datetime('now'));

-- CUSTOMERS
INSERT OR IGNORE INTO customers (id, phone, name, email, total_spending, average_order, order_count, is_vip, is_blacklisted, created_at, updated_at)
VALUES
  ('70000000-0000-0000-0000-000000000001', '01098765432', 'أحمد علي', 'ahmed@example.com', 247, 247, 1, 0, 0, datetime('now'), datetime('now')),
  ('70000000-0000-0000-0000-000000000002', '01123456789', 'فاطمة حسن', NULL, 185, 185, 1, 0, 0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO customer_addresses (id, customer_id, label, city, address, is_default, created_at, updated_at)
VALUES
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'المنزل', 'الجيزة', 'شارع التحرير، الدقي، الجيزة', 1, datetime('now'), datetime('now')),
  ('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', 'العمل', 'القاهرة', 'شارع جامعة الدول، المهندسين، الجيزة', 1, datetime('now'), datetime('now'));

-- ORDERS + ORDER ITEMS
INSERT OR IGNORE INTO orders (id, order_number, customer_id, customer_name, customer_phone, customer_address, branch_id, status, source, payment_status, payment_method, subtotal, discount, delivery_fee, total, notes, created_at, updated_at)
VALUES
  ('90000000-0000-0000-0000-000000000001', 'SG-20260812-000001', '70000000-0000-0000-0000-000000000001', 'أحمد علي', '01098765432', 'شارع التحرير، الدقي، الجيزة', '00000000-0000-0000-0000-000000000001', 'delivered', 'website', 'paid', 'cash', 195, 0, 0, 247, NULL, datetime('now', '-2 hours'), datetime('now', '-2 hours')),
  ('90000000-0000-0000-0000-000000000002', 'SG-20260812-000002', '70000000-0000-0000-0000-000000000002', 'فاطمة حسن', NULL, 'شارع جامعة الدول، المهندسين، الجيزة', '00000000-0000-0000-0000-000000000001', 'preparing', 'website', 'pending', 'cash', 135, 0, 0, 185, NULL, datetime('now', '-1 day'), datetime('now', '-1 day'));

INSERT OR IGNORE INTO order_items (id, order_id, product_id, name_ar, name_en, quantity, unit_price, total, created_at)
VALUES
  ('a2000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'سكر', 'Sugar', 2, 27, 54, datetime('now')),
  ('a2000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'زيت عباد الشمس', 'Sunflower Oil', 1, 72, 72, datetime('now')),
  ('a2000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'أرز بسمتي', 'Basmati Rice', 1, 35, 35, datetime('now')),
  ('a2000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'موتزريلا', 'Mozzarella', 1, 85, 85, datetime('now')),
  ('a2000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', 'مكرونة', 'Pasta', 2, 18, 36, datetime('now'));

INSERT OR IGNORE INTO order_status_history (id, order_id, from_status, to_status, changed_by, note, created_at)
VALUES
  ('a3000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', NULL, 'delivered', NULL, NULL, datetime('now', '-2 hours')),
  ('a3000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002', NULL, 'preparing', NULL, NULL, datetime('now', '-1 day'));

INSERT OR IGNORE INTO order_timeline (id, order_id, type, note, actor_id, metadata, created_at)
VALUES
  ('a4000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'status_change', 'تم تسليم الطلب', NULL, '{}', datetime('now', '-2 hours')),
  ('a4000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002', 'status_change', 'تم قبول الطلب', NULL, '{}', datetime('now', '-1 day'));

-- DELIVERY
INSERT OR IGNORE INTO delivery_drivers (id, name, phone, vehicle, branch_id, status, created_at, updated_at)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'أحمد سعيد', '01011112222', 'موتوسيكل', '00000000-0000-0000-0000-000000000001', 'available', datetime('now'), datetime('now')),
  ('50000000-0000-0000-0000-000000000002', 'مصطفى كامل', '01111112222', 'سكوتر', '00000000-0000-0000-0000-000000000001', 'busy', datetime('now'), datetime('now')),
  ('50000000-0000-0000-0000-000000000003', 'خالد إبراهيم', '01211112222', 'موتوسيكل', '00000000-0000-0000-0000-000000000001', 'offline', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO delivery_areas (id, name, city, fee, min_order, is_active, created_at, updated_at)
VALUES
  ('50000000-0000-0000-0000-000000000010', 'الدقي', 'الجيزة', 0, 300, 1, datetime('now'), datetime('now')),
  ('50000000-0000-0000-0000-000000000011', 'المهندسين', 'الجيزة', 0, 300, 1, datetime('now'), datetime('now')),
  ('50000000-0000-0000-0000-000000000012', 'الهرم', 'الجيزة', 25, 300, 1, datetime('now'), datetime('now')),
  ('50000000-0000-0000-0000-000000000013', 'فيصل', 'الجيزة', 20, 300, 1, datetime('now'), datetime('now')),
  ('50000000-0000-0000-0000-000000000014', 'مدينة نصر', 'القاهرة', 30, 300, 1, datetime('now'), datetime('now')),
  ('50000000-0000-0000-0000-000000000015', 'مصر الجديدة', 'القاهرة', 30, 300, 1, datetime('now'), datetime('now')),
  ('50000000-0000-0000-0000-000000000016', 'شبرا', 'القاهرة', 35, 300, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO delivery_assignments (id, order_id, driver_id, assigned_by, status, notes, assigned_at, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', NULL, NULL, 'delivered', NULL, datetime('now', '-2 hours'), datetime('now', '-2 hours'));

-- INVENTORY MOVEMENTS
INSERT OR IGNORE INTO inventory_movements (id, product_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at)
VALUES
  ('b1000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'sale', -2, 'Order SG-20260812-000001', 'order', '90000000-0000-0000-0000-000000000001', NULL, datetime('now', '-2 hours')),
  ('b1000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'sale', -1, 'Order SG-20260812-000001', 'order', '90000000-0000-0000-0000-000000000001', NULL, datetime('now', '-2 hours')),
  ('b1000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'sale', -1, 'Order SG-20260812-000001', 'order', '90000000-0000-0000-0000-000000000001', NULL, datetime('now', '-2 hours')),
  ('b1000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'sale', -1, 'Order SG-20260812-000002', 'order', '90000000-0000-0000-0000-000000000002', NULL, datetime('now', '-1 day')),
  ('b1000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'sale', -2, 'Order SG-20260812-000002', 'order', '90000000-0000-0000-0000-000000000002', NULL, datetime('now', '-1 day')),
  ('b1000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'initial_stock', 1000, 'Opening stock', 'adjustment', NULL, '10000000-0000-0000-0000-000000000001', datetime('now', '-30 days')),
  ('b1000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'initial_stock', 500, 'Opening stock', 'adjustment', NULL, '10000000-0000-0000-0000-000000000001', datetime('now', '-30 days')),
  ('b1000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', 'initial_stock', 300, 'Opening stock', 'adjustment', NULL, '10000000-0000-0000-0000-000000000001', datetime('now', '-30 days')),
  ('b1000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000004', 'initial_stock', 200, 'Opening stock', 'adjustment', NULL, '10000000-0000-0000-0000-000000000001', datetime('now', '-30 days')),
  ('b1000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000005', 'initial_stock', 150, 'Opening stock', 'adjustment', NULL, '10000000-0000-0000-0000-000000000001', datetime('now', '-30 days')),
  ('b1000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000006', 'initial_stock', 200, 'Opening stock', 'adjustment', NULL, '10000000-0000-0000-0000-000000000001', datetime('now', '-30 days')),
  ('b1000000-0000-0000-0000-00000000000c', '20000000-0000-0000-0000-000000000007', 'initial_stock', 300, 'Opening stock', 'adjustment', NULL, '10000000-0000-0000-0000-000000000001', datetime('now', '-30 days')),
  ('b1000000-0000-0000-0000-00000000000d', '20000000-0000-0000-0000-000000000008', 'initial_stock', 100, 'Opening stock', 'adjustment', NULL, '10000000-0000-0000-0000-000000000001', datetime('now', '-30 days'));

-- ACTIVITY LOG (system seed)
INSERT OR IGNORE INTO activity_logs (id, user_id, action, entity, entity_id, metadata, created_at)
VALUES
  ('c1000000-0000-0000-0000-000000000001', NULL, 'system.seeded', 'database', NULL, '{"migration": "0002_seed_data"}', datetime('now'));

PRAGMA foreign_keys = ON;
