CREATE TABLE `media` (
	`id` char(36) NOT NULL,
	`type` enum('products','collections','blog','testimonials') NOT NULL,
	`storage_key` varchar(255) NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`mime_type` varchar(64) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_storage_key_unique` UNIQUE(`storage_key`)
);
