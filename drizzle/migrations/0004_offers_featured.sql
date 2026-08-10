-- ============================================================
-- Souk El Gomla — Offers featured flag
-- Migration: 0004_offers_featured
-- ============================================================
-- Phase 5 requirement: admin must be able to mark an offer as
-- "featured" (e.g. today's highlighted offer). Adds the boolean
-- column to the existing D1 `offers` table (safe, additive).

ALTER TABLE `offers` ADD COLUMN `is_featured` integer DEFAULT false NOT NULL;
