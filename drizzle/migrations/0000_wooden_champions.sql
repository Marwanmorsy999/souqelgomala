CREATE TABLE `auth_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text,
	`action` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`success` integer DEFAULT true NOT NULL,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`full_name` text DEFAULT '' NOT NULL,
	`phone` text,
	`password_hash` text,
	`role` text DEFAULT 'employee' NOT NULL,
	`avatar` text,
	`branch_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_profiles_role` ON `profiles` (`role`);--> statement-breakpoint
CREATE INDEX `idx_profiles_branch` ON `profiles` (`branch_id`);--> statement-breakpoint
CREATE INDEX `idx_profiles_email` ON `profiles` (`email`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`permissions` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_roles_active` ON `roles` (`is_active`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`session_token` text NOT NULL,
	`expires_at` text NOT NULL,
	`user_agent` text,
	`ip_address` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE INDEX `idx_sessions_profile` ON `sessions` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_token` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `branches` (
	`id` text PRIMARY KEY NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text,
	`code` text,
	`address` text,
	`phone` text,
	`working_hours` text,
	`latitude` real,
	`longitude` real,
	`google_maps_url` text,
	`manager_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_branches_code` ON `branches` (`code`);--> statement-breakpoint
CREATE INDEX `idx_branches_active` ON `branches` (`is_active`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text,
	`parent_id` text,
	`image` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_categories_parent` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_categories_visible` ON `categories` (`is_visible`);--> statement-breakpoint
CREATE TABLE `category_media` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`cloudinary_public_id` text NOT NULL,
	`secure_url` text NOT NULL,
	`width` integer,
	`height` integer,
	`format` text,
	`resource_type` text DEFAULT 'image' NOT NULL,
	`alt` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_category_media_category` ON `category_media` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_category_media_primary` ON `category_media` (`category_id`,`is_primary`);--> statement-breakpoint
CREATE TABLE `product_media` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`cloudinary_public_id` text NOT NULL,
	`secure_url` text NOT NULL,
	`width` integer,
	`height` integer,
	`format` text,
	`resource_type` text DEFAULT 'image' NOT NULL,
	`alt` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_product_media_product` ON `product_media` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_product_media_primary` ON `product_media` (`product_id`,`is_primary`);--> statement-breakpoint
CREATE TABLE `product_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`tag` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_product_tags_product` ON `product_tags` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`barcode` text,
	`sku` text,
	`slug` text,
	`name_ar` text NOT NULL,
	`name_en` text,
	`description` text,
	`brand` text,
	`category_id` text,
	`price` real DEFAULT 0 NOT NULL,
	`offer_price` real,
	`wholesale_price` real,
	`compare_at_price` real,
	`cost_price` real,
	`unit` text DEFAULT 'piece' NOT NULL,
	`weight` real,
	`stock` integer DEFAULT 0 NOT NULL,
	`min_stock` integer DEFAULT 10 NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_new_arrival` integer DEFAULT false NOT NULL,
	`is_best_seller` integer DEFAULT false NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`image_alt` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_products_barcode` ON `products` (`barcode`);--> statement-breakpoint
CREATE INDEX `idx_products_sku` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `idx_products_status` ON `products` (`status`);--> statement-breakpoint
CREATE INDEX `idx_products_stock` ON `products` (`stock`);--> statement-breakpoint
CREATE INDEX `idx_products_brand` ON `products` (`brand`);--> statement-breakpoint
CREATE INDEX `idx_products_slug` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_display_order` ON `products` (`display_order`);--> statement-breakpoint
CREATE INDEX `idx_products_low_stock` ON `products` (`id`);--> statement-breakpoint
CREATE INDEX `idx_products_featured` ON `products` (`id`);--> statement-breakpoint
CREATE TABLE `customer_addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`label` text,
	`city` text NOT NULL,
	`address` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_customer_addresses_customer` ON `customer_addresses` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_customer_addresses_default` ON `customer_addresses` (`is_default`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`name` text,
	`email` text,
	`total_spending` real DEFAULT 0 NOT NULL,
	`average_order` real DEFAULT 0 NOT NULL,
	`order_count` integer DEFAULT 0 NOT NULL,
	`is_vip` integer DEFAULT false NOT NULL,
	`is_blacklisted` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_customers_phone` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `idx_customers_vip` ON `customers` (`is_vip`);--> statement-breakpoint
CREATE INDEX `idx_customers_total_spending` ON `customers` (`total_spending`);--> statement-breakpoint
CREATE TABLE `delivery_areas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`fee` real DEFAULT 0 NOT NULL,
	`min_order` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_delivery_areas_city` ON `delivery_areas` (`city`);--> statement-breakpoint
CREATE INDEX `idx_delivery_areas_active` ON `delivery_areas` (`is_active`);--> statement-breakpoint
CREATE TABLE `delivery_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`driver_id` text,
	`assigned_by` text,
	`status` text DEFAULT 'assigned' NOT NULL,
	`notes` text,
	`assigned_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_delivery_assignments_order` ON `delivery_assignments` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_delivery_assignments_driver` ON `delivery_assignments` (`driver_id`);--> statement-breakpoint
CREATE TABLE `delivery_drivers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`vehicle` text,
	`branch_id` text,
	`status` text DEFAULT 'available' NOT NULL,
	`current_order_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_delivery_drivers_branch` ON `delivery_drivers` (`branch_id`);--> statement-breakpoint
CREATE INDEX `idx_delivery_drivers_status` ON `delivery_drivers` (`status`);--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`group_id` text,
	`label` text NOT NULL,
	`description` text,
	`is_enabled` integer DEFAULT false NOT NULL,
	`value` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feature_flags_key_unique` ON `feature_flags` (`key`);--> statement-breakpoint
CREATE INDEX `idx_feature_flags_key` ON `feature_flags` (`key`);--> statement-breakpoint
CREATE INDEX `idx_feature_flags_enabled` ON `feature_flags` (`is_enabled`);--> statement-breakpoint
CREATE TABLE `feature_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feature_groups_name_unique` ON `feature_groups` (`name`);--> statement-breakpoint
CREATE INDEX `idx_feature_groups_active` ON `feature_groups` (`is_active`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text,
	`name_ar` text NOT NULL,
	`name_en` text,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	`total` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_order_items_product` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`changed_by` text,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_order_history_order` ON `order_status_history` (`order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `order_timeline` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`type` text NOT NULL,
	`note` text,
	`actor_id` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_order_timeline_order` ON `order_timeline` (`order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`customer_id` text,
	`customer_name` text,
	`customer_phone` text,
	`customer_address` text,
	`branch_id` text,
	`status` text DEFAULT 'new' NOT NULL,
	`source` text DEFAULT 'admin' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`payment_method` text,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`delivery_fee` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`driver_id` text,
	`assigned_driver_name` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `idx_orders_status` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_orders_created` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_customer` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_orders_driver` ON `orders` (`driver_id`);--> statement-breakpoint
CREATE INDEX `idx_orders_branch` ON `orders` (`branch_id`);--> statement-breakpoint
CREATE INDEX `idx_orders_order_number` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `idx_orders_updated` ON `orders` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_source` ON `orders` (`source`);--> statement-breakpoint
CREATE INDEX `idx_orders_payment_status` ON `orders` (`payment_status`);--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`banner` text,
	`campaign_name` text NOT NULL,
	`discount_type` text NOT NULL,
	`value` real,
	`buy_x` integer,
	`get_y` integer,
	`product_ids` text DEFAULT '[]' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_offers_status` ON `offers` (`status`);--> statement-breakpoint
CREATE INDEX `idx_offers_dates` ON `offers` (`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `idx_offers_active` ON `offers` (`id`);--> statement-breakpoint
CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_activity_logs_created` ON `activity_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_activity_logs_entity` ON `activity_logs` (`entity`,`entity_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`severity` text DEFAULT 'info' NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`read_at` text,
	`entity` text,
	`entity_id` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_read_at` ON `notifications` (`read_at`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notifications_created` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE INDEX `idx_settings_key` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`movement_type` text NOT NULL,
	`quantity` integer NOT NULL,
	`reason` text,
	`reference_type` text,
	`reference_id` text,
	`created_by` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_movements_product` ON `inventory_movements` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_inventory_movements_type` ON `inventory_movements` (`movement_type`);--> statement-breakpoint
CREATE INDEX `idx_inventory_movements_created` ON `inventory_movements` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_inventory_movements_ref` ON `inventory_movements` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_order_id` text NOT NULL,
	`product_id` text,
	`quantity` integer NOT NULL,
	`unit_cost` real NOT NULL,
	`total` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_purchase_order_items_po` ON `purchase_order_items` (`purchase_order_id`);--> statement-breakpoint
CREATE INDEX `idx_purchase_order_items_product` ON `purchase_order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`po_number` text NOT NULL,
	`supplier_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`expected_date` text,
	`received_date` text,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_po_number_unique` ON `purchase_orders` (`po_number`);--> statement-breakpoint
CREATE INDEX `idx_purchase_orders_supplier` ON `purchase_orders` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `idx_purchase_orders_status` ON `purchase_orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_purchase_orders_po_number` ON `purchase_orders` (`po_number`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`tax_id` text,
	`payment_terms` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_suppliers_name` ON `suppliers` (`name`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_active` ON `suppliers` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_tax_id` ON `suppliers` (`tax_id`);--> statement-breakpoint
CREATE TABLE `return_items` (
	`id` text PRIMARY KEY NOT NULL,
	`return_id` text NOT NULL,
	`product_id` text,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	`total` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_return_items_return` ON `return_items` (`return_id`);--> statement-breakpoint
CREATE INDEX `idx_return_items_product` ON `return_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `returns` (
	`id` text PRIMARY KEY NOT NULL,
	`return_number` text NOT NULL,
	`order_id` text,
	`customer_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reason` text,
	`total_refund` real DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `returns_return_number_unique` ON `returns` (`return_number`);--> statement-breakpoint
CREATE INDEX `idx_returns_order` ON `returns` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_returns_customer` ON `returns` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_returns_status` ON `returns` (`status`);--> statement-breakpoint
CREATE INDEX `idx_returns_return_number` ON `returns` (`return_number`);