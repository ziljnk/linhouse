CREATE TABLE `product_suggestion_item` (
	`rail` varchar(32) NOT NULL,
	`product_id` char(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `product_suggestion_item_pkey` PRIMARY KEY(`rail`,`product_id`),
	CONSTRAINT `product_suggestion_item_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE cascade
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE INDEX `product_suggestion_item_rail_sort_idx` ON `product_suggestion_item` (`rail`,`sort_order`);
