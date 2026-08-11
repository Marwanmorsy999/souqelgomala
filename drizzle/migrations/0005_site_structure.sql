-- ============================================================
-- Souk El Gomla - Site Settings & Structure Module
-- Migration: 0005_site_structure
-- ============================================================

PRAGMA foreign_keys = OFF;

-- CATEGORIES: add icon_url for category icons
ALTER TABLE categories ADD COLUMN icon_url text;

-- NAV LINKS
CREATE TABLE nav_links (
  id text PRIMARY KEY NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  visible integer NOT NULL DEFAULT 1,
  target text NOT NULL DEFAULT 'internal',
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_nav_links_visible ON nav_links(visible);
CREATE INDEX idx_nav_links_order ON nav_links(sort_order);

-- FOOTER LINKS
CREATE TABLE footer_links (
  id text PRIMARY KEY NOT NULL,
  section text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  visible integer NOT NULL DEFAULT 1,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_footer_links_section ON footer_links(section);
CREATE INDEX idx_footer_links_visible ON footer_links(visible);
CREATE INDEX idx_footer_links_order ON footer_links(sort_order);

-- HOMEPAGE SECTIONS
CREATE TABLE homepage_sections (
  id text PRIMARY KEY NOT NULL,
  section_key text NOT NULL UNIQUE,
  visible integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_homepage_sections_key ON homepage_sections(section_key);
CREATE INDEX idx_homepage_sections_visible ON homepage_sections(visible);
CREATE INDEX idx_homepage_sections_order ON homepage_sections(sort_order);

-- DELIVERY ZONES
CREATE TABLE delivery_zones (
  id text PRIMARY KEY NOT NULL,
  area_name text NOT NULL,
  delivery_fee real NOT NULL DEFAULT 0,
  estimated_time text NOT NULL DEFAULT '',
  active integer NOT NULL DEFAULT 1,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_delivery_zones_active ON delivery_zones(active);

-- STATIC PAGES
CREATE TABLE static_pages (
  id text PRIMARY KEY NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  meta_title text,
  meta_description text,
  published integer NOT NULL DEFAULT 0,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_static_pages_slug ON static_pages(slug);
CREATE INDEX idx_static_pages_published ON static_pages(published);

-- SEO SETTINGS
CREATE TABLE seo_settings (
  id text PRIMARY KEY NOT NULL,
  page_key text NOT NULL UNIQUE,
  meta_title_template text NOT NULL,
  meta_description_template text NOT NULL,
  og_image_default text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE INDEX idx_seo_settings_page_key ON seo_settings(page_key);

-- SEED DEFAULT NAV LINKS
INSERT INTO nav_links (id, label, url, sort_order, visible, target, created_at, updated_at)
VALUES
  ('nav-1', 'الرئيسية', '#home', 0, 1, 'internal', datetime('now'), datetime('now')),
  ('nav-2', 'الأقسام', '#categories', 1, 1, 'internal', datetime('now'), datetime('now')),
  ('nav-3', 'العروض', '#offers', 2, 1, 'internal', datetime('now'), datetime('now')),
  ('nav-4', 'المنتجات', '#products', 3, 1, 'internal', datetime('now'), datetime('now')),
  ('nav-5', 'تواصل معنا', '#contact', 4, 1, 'internal', datetime('now'), datetime('now'));

-- SEED DEFAULT FOOTER LINKS
INSERT INTO footer_links (id, section, label, url, sort_order, visible, created_at, updated_at)
VALUES
  ('fl-1', 'quick_links', 'الرئيسية', '#home', 0, 1, datetime('now'), datetime('now')),
  ('fl-2', 'quick_links', 'الأقسام', '#categories', 1, 1, datetime('now'), datetime('now')),
  ('fl-3', 'quick_links', 'المنتجات', '#products', 2, 1, datetime('now'), datetime('now')),
  ('fl-4', 'quick_links', 'العروض', '#offers', 3, 1, datetime('now'), datetime('now')),
  ('fl-5', 'contact', 'واتساب', 'https://wa.me/201222464999', 0, 1, datetime('now'), datetime('now')),
  ('fl-6', 'contact', 'فيسبوك', 'https://www.facebook.com/share/1FZUWgbRkR/', 1, 1, datetime('now'), datetime('now')),
  ('fl-7', 'contact', 'انستجرام', 'https://www.instagram.com/soukelgomla', 2, 1, datetime('now'), datetime('now')),
  ('fl-8', 'contact', 'تيك توك', 'https://www.tiktok/@soukelgomla', 3, 1, datetime('now'), datetime('now')),
  ('fl-9', 'social', 'فيسبوك', 'https://www.facebook.com/share/1FZUWgbRkR/', 0, 1, datetime('now'), datetime('now')),
  ('fl-10', 'social', 'انستجرام', 'https://www.instagram.com/soukelgomla', 1, 1, datetime('now'), datetime('now')),
  ('fl-11', 'social', 'تيك توك', 'https://www.tiktok/@soukelgomla', 2, 1, datetime('now'), datetime('now'));

-- SEED DEFAULT HOMEPAGE SECTIONS
INSERT INTO homepage_sections (id, section_key, visible, sort_order, created_at, updated_at)
VALUES
  ('hs-1', 'hero', 1, 0, datetime('now'), datetime('now')),
  ('hs-2', 'deals_strip', 1, 1, datetime('now'), datetime('now')),
  ('hs-3', 'categories', 1, 2, datetime('now'), datetime('now')),
  ('hs-4', 'products', 1, 3, datetime('now'), datetime('now')),
  ('hs-5', 'social_strip', 1, 4, datetime('now'), datetime('now'));

-- SEED DEFAULT SEO SETTINGS
INSERT INTO seoSettings (id, page_key, meta_title_template, meta_description_template, og_image_default, created_at, updated_at)
VALUES
  ('seo-1', 'homepage', 'سوق الجملة - {name}', 'منتجات غذائية ومنزلية بأسعار الجملة للجميع.', '', datetime('now'), datetime('now')),
  ('seo-2', 'category', '{name} - سوق الجملة', 'تسوق {name} بأسعار الجملة والقطاعي.', '', datetime('now'), datetime('now')),
  ('seo-3', 'product', '{name} - سوق الجملة', '{name} متوفر بأسعار الجملة في سوق الجملة.', '', datetime('now'), datetime('now'));

-- SEED DEFAULT DELIVERY ZONES
INSERT INTO delivery_zones (id, area_name, delivery_fee, estimated_time, active, created_at, updated_at)
VALUES
  ('dz-1', 'كفر شكر', 25, 'ساعة واحدة', 1, datetime('now'), datetime('now')),
  ('dz-2', 'المناطق المجاورة', 40, 'ساعتان', 1, datetime('now'), datetime('now')),
  ('dz-3', 'القليوبية', 50, '2-3 ساعات', 1, datetime('now'), datetime('now'));

-- SEED DEFAULT STATIC PAGES
INSERT INTO static_pages (id, slug, title, content, meta_title, meta_description, published, created_at, updated_at)
VALUES
  ('sp-1', 'from-us', 'من نحن', '<h2>سوق الجملة</h2><p>منتجات غذائية ومنزلية بأسعار الجملة للجميع.</p>', 'من نحن - سوق الجملة', 'تعرف على سوق الجملة ومنتجاتنا', 1, datetime('now'), datetime('now')),
  ('sp-2', 'terms', 'الشروط والأحكام', '<h2>الشروط والأحكام</h2><p>باستخدامك للمتجر فإنك توافق على الشروط.</p>', 'الشروط والأحكام - سوق الجملة', 'الشروط والأحكام لاستخدام متجر سوق الجملة', 1, datetime('now'), datetime('now')),
  ('sp-3', 'privacy', 'سياسة الخصوصية', '<h2>سياسة الخصوصية</h2><p>نحترم خصوصيتك ونحمي بياناتك.</p>', 'سياسة الخصوصية - سوق الجملة', 'سياسة الخصوصية لسوق الجملة', 1, datetime('now'), datetime('now'));

PRAGMA foreign_keys = ON;
