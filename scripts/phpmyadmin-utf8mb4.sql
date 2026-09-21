-- phpMyAdmin: run each section separately. Do not paste drizzle/0002_*.sql.

-- 1) Drop foreign keys (required before charset conversion)
ALTER TABLE `account` DROP FOREIGN KEY `account_userId_fkey`;
ALTER TABLE `blog_post` DROP FOREIGN KEY `blog_post_category_id_fkey`;
ALTER TABLE `catalog_attribute` DROP FOREIGN KEY `catalog_attribute_group_id_fkey`;
ALTER TABLE `collection_image` DROP FOREIGN KEY `collection_image_collection_id_fkey`;
ALTER TABLE `product_attribute` DROP FOREIGN KEY `product_attribute_product_id_fkey`;
ALTER TABLE `product_attribute` DROP FOREIGN KEY `product_attribute_attribute_id_fkey`;
ALTER TABLE `product_collection` DROP FOREIGN KEY `product_collection_product_id_fkey`;
ALTER TABLE `product_collection` DROP FOREIGN KEY `product_collection_collection_id_fkey`;
ALTER TABLE `product_image` DROP FOREIGN KEY `product_image_product_id_fkey`;
ALTER TABLE `session` DROP FOREIGN KEY `session_userId_fkey`;
ALTER TABLE `testimonial` DROP FOREIGN KEY `testimonial_product_id_fkey`;

-- 2) Then in phpMyAdmin: database -> Operations
--    Collation: utf8mb4_unicode_ci
--    Tick "Change all tables collations" AND "Change all tables columns collations"
--    Go

-- 3) Recreate foreign keys
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `blog_post` ADD CONSTRAINT `blog_post_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `blog_category`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE `catalog_attribute` ADD CONSTRAINT `catalog_attribute_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `attribute_group`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `collection_image` ADD CONSTRAINT `collection_image_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collection`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `product_attribute` ADD CONSTRAINT `product_attribute_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `product_attribute` ADD CONSTRAINT `product_attribute_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `catalog_attribute`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `product_collection` ADD CONSTRAINT `product_collection_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `product_collection` ADD CONSTRAINT `product_collection_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collection`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `product_image` ADD CONSTRAINT `product_image_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `testimonial` ADD CONSTRAINT `testimonial_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
