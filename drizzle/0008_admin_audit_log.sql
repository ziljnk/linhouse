CREATE TABLE `admin_audit_log` (
	`id` char(36) NOT NULL,
	`actor_user_id` varchar(255) NOT NULL,
	`actor_name` varchar(255) NOT NULL,
	`actor_email` varchar(255) NOT NULL,
	`action` varchar(16) NOT NULL,
	`area` varchar(32) NOT NULL,
	`entity_label` varchar(500) NOT NULL,
	`summary` varchar(500) NOT NULL,
	`changes` json NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now(3)),
	CONSTRAINT `admin_audit_log_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE INDEX `admin_audit_log_created_at_idx` ON `admin_audit_log` (`created_at`);
--> statement-breakpoint
CREATE INDEX `admin_audit_log_area_created_at_idx` ON `admin_audit_log` (`area`,`created_at`);
