-- ============================================================
-- Souk El Gomla — Taxonomy departments (semantic categorization)
-- Migration: 0003_taxonomy_departments
-- ============================================================
-- Adds the six departments defined in src/lib/categorization/taxonomy.ts that
-- had no DB row yet (Spices, Sauces, Canned & Preserved, Bakery & Biscuits,
-- Stationery, Small Appliances). IDs match the taxonomy exactly so the
-- homepage / navigation / products stay synchronized with the D1 categories.
-- INSERT OR IGNORE keeps this idempotent and non-destructive.

PRAGMA foreign_keys = OFF;

INSERT OR IGNORE INTO categories (id, name_ar, name_en, parent_id, sort_order, is_visible, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000060', 'بهارات', 'Spices', '10000000-0000-0000-0000-000000000001', 4, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000061', 'صلصات', 'Sauces', '10000000-0000-0000-0000-000000000001', 5, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000062', 'معلبات', 'Canned & Preserved', '10000000-0000-0000-0000-000000000001', 6, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000063', 'مخبوزات وبسكويت', 'Bakery & Biscuits', '10000000-0000-0000-0000-000000000001', 7, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000070', 'قرطاسية', 'Stationery', NULL, 8, 1, datetime('now'), datetime('now')),
  ('10000000-0000-0000-0000-000000000071', 'أجهزة صغيرة', 'Small Appliances', NULL, 9, 1, datetime('now'), datetime('now'));

PRAGMA foreign_keys = ON;
