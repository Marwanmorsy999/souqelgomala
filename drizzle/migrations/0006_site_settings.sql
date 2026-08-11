-- ============================================================
-- Souk El Gomla - Site Settings (general/business config)
-- Migration: 0006_site_settings
-- ============================================================

PRAGMA foreign_keys = OFF;

CREATE TABLE site_settings (
  id text PRIMARY KEY NOT NULL,
  business_name text NOT NULL DEFAULT 'سوق الجملة',
  logo_url text,
  phone_primary text,
  phone_secondary text,
  address text,
  whatsapp_number text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  min_order_value real NOT NULL DEFAULT 0,
  free_delivery_threshold real NOT NULL DEFAULT 0,
  default_delivery_fee real NOT NULL DEFAULT 0,
  updated_by text,
  updated_at text NOT NULL
);
CREATE INDEX idx_site_settings_id ON site_settings(id);

-- Seed default business settings (merged from existing storefront defaults).
INSERT INTO site_settings (
  id, business_name, logo_url, phone_primary, phone_secondary, address,
  whatsapp_number, facebook_url, instagram_url, tiktok_url,
  min_order_value, free_delivery_threshold, default_delivery_fee, updated_at
)
VALUES (
  'site',
  'سوق الجملة',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Aug%206%2C%202026%2C%2001_59_41%20PM-XlqTPzN2O6W7ZSsRAbrdzcpshw4863.png',
  '01222464999',
  '01090787378',
  'كفر شكر، القليوبية، مصر',
  '201222464999',
  'https://www.facebook.com/share/1FZUWgbRkR/',
  'https://www.instagram.com/soukelgomla',
  'https://www.tiktok.com/@soukelgomla',
  0, 0, 0,
  datetime('now')
);

PRAGMA foreign_keys = ON;
