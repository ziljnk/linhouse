CREATE TABLE `account` (
	`id` varchar(255) NOT NULL,
	`accountId` varchar(255) NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` timestamp(3),
	`refreshTokenExpiresAt` timestamp(3),
	`scope` text,
	`password` text,
	`createdAt` timestamp(3) NOT NULL DEFAULT (now()),
	`updatedAt` timestamp(3) NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_pageview` (
	`id` char(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`path` varchar(512) NOT NULL,
	`locale` varchar(8),
	`entity_type` varchar(32),
	`entity_id` char(36),
	`country_code` varchar(8) NOT NULL DEFAULT 'XX',
	`referrer_host` varchar(255) NOT NULL DEFAULT '(direct)',
	`device_type` varchar(16) NOT NULL DEFAULT 'desktop',
	CONSTRAINT `analytics_pageview_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointment` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(64) NOT NULL,
	`email` varchar(255) NOT NULL,
	`store` varchar(255) NOT NULL,
	`preferred_date` date NOT NULL,
	`preferred_time` varchar(32) NOT NULL DEFAULT '',
	`message` text NOT NULL,
	`locale` varchar(8) NOT NULL DEFAULT 'vi',
	`email_sent_at` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `appointment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attribute_group` (
	`id` char(36) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`label` json NOT NULL,
	`selection` enum('single','multiple') NOT NULL DEFAULT 'single',
	`kind` enum('gown','ao-dai') NOT NULL DEFAULT 'gown',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `attribute_group_id` PRIMARY KEY(`id`),
	CONSTRAINT `attribute_group_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_category` (
	`id` char(36) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`label` json NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_category_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_category_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_post` (
	`id` char(36) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`category_id` char(36) NOT NULL,
	`title` json NOT NULL,
	`excerpt` json NOT NULL,
	`image_alt` json NOT NULL,
	`content` json NOT NULL,
	`cover_url` text NOT NULL,
	`status` enum('draft','scheduled','published') NOT NULL DEFAULT 'draft',
	`published_at` timestamp(3),
	`seo_title` json NOT NULL,
	`seo_description` json NOT NULL,
	`seo_keywords` json NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_post_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_post_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `catalog_attribute` (
	`id` char(36) NOT NULL,
	`group_id` char(36) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`label` json NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `catalog_attribute_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_attribute_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `collection` (
	`id` char(36) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`year` int,
	`name` json NOT NULL,
	`subtitle` json NOT NULL,
	`image_alt` json NOT NULL,
	`cover_url` text NOT NULL,
	`status` enum('draft','scheduled','published') NOT NULL DEFAULT 'draft',
	`published_at` timestamp(3),
	`sort_order` int NOT NULL DEFAULT 0,
	`seo_title` json NOT NULL,
	`seo_description` json NOT NULL,
	`seo_keywords` json NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_id` PRIMARY KEY(`id`),
	CONSTRAINT `collection_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `collection_image` (
	`id` char(36) NOT NULL,
	`collection_id` char(36) NOT NULL,
	`url` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `collection_image_id` PRIMARY KEY(`id`),
	CONSTRAINT `collection_image_collection_sort_key` UNIQUE(`collection_id`,`sort_order`)
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` char(36) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`sort_number` int NOT NULL DEFAULT 0,
	`name` text NOT NULL,
	`code` varchar(255) NOT NULL DEFAULT '',
	`full_title` text NOT NULL,
	`description` json NOT NULL,
	`price_vnd` int,
	`price_display` enum('amount','contact') NOT NULL DEFAULT 'contact',
	`kind` enum('gown','ao-dai') NOT NULL DEFAULT 'gown',
	`featured` boolean NOT NULL DEFAULT true,
	`status` enum('draft','scheduled','published') NOT NULL DEFAULT 'draft',
	`published_at` timestamp(3),
	`sort_order` int NOT NULL DEFAULT 0,
	`tags` json NOT NULL,
	`seo_title` json NOT NULL,
	`seo_description` json NOT NULL,
	`seo_keywords` json NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `product_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `product_attribute` (
	`product_id` char(36) NOT NULL,
	`attribute_id` char(36) NOT NULL,
	CONSTRAINT `product_attribute_pkey` PRIMARY KEY(`product_id`,`attribute_id`)
);
--> statement-breakpoint
CREATE TABLE `product_collection` (
	`product_id` char(36) NOT NULL,
	`collection_id` char(36) NOT NULL,
	CONSTRAINT `product_collection_pkey` PRIMARY KEY(`product_id`,`collection_id`)
);
--> statement-breakpoint
CREATE TABLE `product_image` (
	`id` char(36) NOT NULL,
	`product_id` char(36) NOT NULL,
	`url` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `product_image_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_image_product_sort_key` UNIQUE(`product_id`,`sort_order`)
);
--> statement-breakpoint
CREATE TABLE `rateLimit` (
	`id` varchar(255) NOT NULL,
	`key` varchar(255) NOT NULL,
	`count` int NOT NULL,
	`lastRequest` bigint NOT NULL,
	CONSTRAINT `rateLimit_id` PRIMARY KEY(`id`),
	CONSTRAINT `rateLimit_key_key` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(255) NOT NULL,
	`expiresAt` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT (now()),
	`updatedAt` timestamp(3) NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` varchar(255) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_key` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `site_copy` (
	`key` varchar(255) NOT NULL,
	`value` json NOT NULL,
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `site_copy_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` varchar(32) NOT NULL DEFAULT 'default',
	`data` json NOT NULL,
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonial` (
	`id` char(36) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`image_url` text NOT NULL,
	`quote` json NOT NULL,
	`image_alt` json NOT NULL,
	`gown` varchar(255) NOT NULL DEFAULT '',
	`product_id` char(36),
	`year` int,
	`status` enum('draft','scheduled','published') NOT NULL DEFAULT 'draft',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonial_id` PRIMARY KEY(`id`),
	CONSTRAINT `testimonial_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`emailVerified` boolean NOT NULL,
	`image` text,
	`createdAt` timestamp(3) NOT NULL DEFAULT (now()),
	`updatedAt` timestamp(3) NOT NULL DEFAULT (now()),
	`mustChangePassword` boolean DEFAULT true,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_key` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(255) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expiresAt` timestamp(3) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT (now()),
	`updatedAt` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_post` ADD CONSTRAINT `blog_post_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `blog_category`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `catalog_attribute` ADD CONSTRAINT `catalog_attribute_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `attribute_group`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_image` ADD CONSTRAINT `collection_image_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collection`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_attribute` ADD CONSTRAINT `product_attribute_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_attribute` ADD CONSTRAINT `product_attribute_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `catalog_attribute`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_collection` ADD CONSTRAINT `product_collection_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_collection` ADD CONSTRAINT `product_collection_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collection`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_image` ADD CONSTRAINT `product_image_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testimonial` ADD CONSTRAINT `testimonial_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE INDEX `analytics_pageview_created_at_idx` ON `analytics_pageview` (`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_pageview_entity_idx` ON `analytics_pageview` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_pageview_country_idx` ON `analytics_pageview` (`country_code`,`created_at`);--> statement-breakpoint
CREATE INDEX `appointment_created_at_idx` ON `appointment` (`created_at`);--> statement-breakpoint
CREATE INDEX `blog_post_category_id_idx` ON `blog_post` (`category_id`);--> statement-breakpoint
CREATE INDEX `blog_post_status_published_at_idx` ON `blog_post` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `catalog_attribute_group_id_idx` ON `catalog_attribute` (`group_id`);--> statement-breakpoint
CREATE INDEX `collection_status_published_at_idx` ON `collection` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `collection_image_collection_id_idx` ON `collection_image` (`collection_id`);--> statement-breakpoint
CREATE INDEX `product_status_published_at_idx` ON `product` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `product_attribute_attribute_id_idx` ON `product_attribute` (`attribute_id`);--> statement-breakpoint
CREATE INDEX `product_attribute_product_id_idx` ON `product_attribute` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_collection_collection_id_idx` ON `product_collection` (`collection_id`);--> statement-breakpoint
CREATE INDEX `product_collection_product_id_idx` ON `product_collection` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_image_product_id_idx` ON `product_image` (`product_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `testimonial_product_id_idx` ON `testimonial` (`product_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);