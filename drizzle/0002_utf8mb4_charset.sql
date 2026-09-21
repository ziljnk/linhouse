SET FOREIGN_KEY_CHECKS = 0;
--> statement-breakpoint
ALTER TABLE `account` DROP FOREIGN KEY `account_userId_fkey`;
--> statement-breakpoint
ALTER TABLE `blog_post` DROP FOREIGN KEY `blog_post_category_id_fkey`;
--> statement-breakpoint
ALTER TABLE `catalog_attribute` DROP FOREIGN KEY `catalog_attribute_group_id_fkey`;
--> statement-breakpoint
ALTER TABLE `collection_image` DROP FOREIGN KEY `collection_image_collection_id_fkey`;
--> statement-breakpoint
ALTER TABLE `product_attribute` DROP FOREIGN KEY `product_attribute_product_id_fkey`;
--> statement-breakpoint
ALTER TABLE `product_attribute` DROP FOREIGN KEY `product_attribute_attribute_id_fkey`;
--> statement-breakpoint
ALTER TABLE `product_collection` DROP FOREIGN KEY `product_collection_product_id_fkey`;
--> statement-breakpoint
ALTER TABLE `product_collection` DROP FOREIGN KEY `product_collection_collection_id_fkey`;
--> statement-breakpoint
ALTER TABLE `product_image` DROP FOREIGN KEY `product_image_product_id_fkey`;
--> statement-breakpoint
ALTER TABLE `session` DROP FOREIGN KEY `session_userId_fkey`;
--> statement-breakpoint
ALTER TABLE `testimonial` DROP FOREIGN KEY `testimonial_product_id_fkey`;
--> statement-breakpoint
ALTER TABLE `account` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `analytics_pageview` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `appointment` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `attribute_group` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `blog_category` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `blog_post` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `catalog_attribute` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `collection` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `collection_image` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `media` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `product` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `product_attribute` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `product_collection` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `product_image` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `rateLimit` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `session` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `site_copy` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `site_settings` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `testimonial` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `user` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `verification` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blog_post` ADD CONSTRAINT `blog_post_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `blog_category`(`id`) ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `catalog_attribute` ADD CONSTRAINT `catalog_attribute_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `attribute_group`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `collection_image` ADD CONSTRAINT `collection_image_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collection`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `product_attribute` ADD CONSTRAINT `product_attribute_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `product_attribute` ADD CONSTRAINT `product_attribute_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `catalog_attribute`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `product_collection` ADD CONSTRAINT `product_collection_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `product_collection` ADD CONSTRAINT `product_collection_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collection`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `product_image` ADD CONSTRAINT `product_image_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `testimonial` ADD CONSTRAINT `testimonial_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
SET FOREIGN_KEY_CHECKS = 1;
