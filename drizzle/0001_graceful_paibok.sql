CREATE TABLE `inventory_items` (
	`id` varchar(36) NOT NULL,
	`category` text NOT NULL,
	`product_code` varchar(255) NOT NULL,
	`product_description` text NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`current_cost` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_items_product_code_unique` UNIQUE(`product_code`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','tech') NOT NULL DEFAULT 'tech';