CREATE TABLE `home_product_carousel_item` (
	`slot` int NOT NULL,
	`product_id` char(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `home_product_carousel_item_pkey` PRIMARY KEY(`slot`,`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE INDEX `home_product_carousel_item_slot_sort_idx` ON `home_product_carousel_item` (`slot`,`sort_order`);
--> statement-breakpoint
ALTER TABLE `home_product_carousel_item` ADD CONSTRAINT `home_product_carousel_item_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE cascade ON UPDATE no action;
