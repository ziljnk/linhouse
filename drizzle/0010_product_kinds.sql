ALTER TABLE `attribute_group` MODIFY `kind` varchar(64) NOT NULL DEFAULT 'gown';
--> statement-breakpoint
ALTER TABLE `product` MODIFY `kind` varchar(64) NOT NULL DEFAULT 'gown';
--> statement-breakpoint
CREATE TABLE `product_kind` (
	`id` char(36) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`label` json NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `product_kind_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_kind_slug_key` UNIQUE(`slug`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
INSERT INTO `product_kind` (`id`, `slug`, `label`, `sort_order`) VALUES
	('7c9e6679-7425-40de-944b-e07fc1f90ae7', 'gown', JSON_OBJECT('vi', 'Váy cưới', 'en', 'Wedding dress'), 0),
	('8d9e6679-7425-40de-944b-e07fc1f90ae8', 'ao-dai', JSON_OBJECT('vi', 'Áo dài', 'en', 'Ao dai'), 1);
