-- ============================================================
-- Souk El Gomla — Social Posts (admin-managed daily offers)
-- Migration: 0003_social_posts
-- ============================================================
-- The business publishes daily offers on Facebook/Instagram/TikTok.
-- Admins manage the REAL post URLs/thumbnails here; the storefront
-- SocialFeed renders ONLY admin-managed posts (no scraping/live feed).
-- `linked_offer_id` bridges a post to its offers-table campaign so
-- the "عرض النهارده" badge can point at the matching daily offer.

CREATE TABLE `social_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`url` text NOT NULL,
	`thumbnail` text,
	`title` text NOT NULL,
	`caption` text,
	`post_date` text NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`linked_offer_id` text,
	`is_visible` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_social_posts_visible` ON `social_posts` (`is_visible`);--> statement-breakpoint
CREATE INDEX `idx_social_posts_featured` ON `social_posts` (`featured`);--> statement-breakpoint
CREATE INDEX `idx_social_posts_date` ON `social_posts` (`post_date`);