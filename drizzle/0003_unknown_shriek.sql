CREATE TABLE `parts_requests` (
	`id` varchar(36) NOT NULL,
	`job_id` varchar(255) NOT NULL,
	`category` text NOT NULL,
	`product_code` varchar(255),
	`requested_description` text NOT NULL,
	`quantity_requested` int NOT NULL,
	`priority` enum('normal','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('new','ordered','ready','completed','denied') NOT NULL DEFAULT 'new',
	`notes` text,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parts_requests_id` PRIMARY KEY(`id`)
);
