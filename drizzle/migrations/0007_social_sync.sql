-- ============================================================
-- Souk El Gomla — Social Posts auto-sync columns
-- Migration: 0007_social_sync
-- ============================================================
-- Adds metadata for posts auto-synced from the official Meta Graph
-- (Facebook + Instagram) and TikTok Display APIs. Existing manual posts
-- are preserved (is_synced defaults to false).

ALTER TABLE `social_posts` ADD COLUMN `external_id` text;--> statement-breakpoint
ALTER TABLE `social_posts` ADD COLUMN `sync_source` text;--> statement-breakpoint
ALTER TABLE `social_posts` ADD COLUMN `is_synced` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_social_posts_external` ON `social_posts` (`external_id`);
