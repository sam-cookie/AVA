ALTER TABLE `utang` ADD COLUMN `fund_id` integer REFERENCES `funds`(`id`);
--> statement-breakpoint
ALTER TABLE `utang` ADD COLUMN `transaction_id` integer REFERENCES `transactions`(`id`) ON DELETE cascade;
