ALTER TABLE `media` MODIFY COLUMN `type` enum('products','collections','blog','testimonials','about','hero','promotions') NOT NULL;
--> statement-breakpoint
CREATE TABLE `promotion_popup` (
	`id` varchar(32) NOT NULL DEFAULT 'default',
	`enabled` boolean NOT NULL DEFAULT false,
	`image_storage_key` varchar(255),
	`image_filename` varchar(255),
	`image_bytes` int,
	`image_alt` varchar(500) NOT NULL DEFAULT '',
	`link_url` varchar(2048),
	`starts_on` date,
	`ends_on` date,
	`updated_at` timestamp(3) NOT NULL DEFAULT (now(3)),
	CONSTRAINT `promotion_popup_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
