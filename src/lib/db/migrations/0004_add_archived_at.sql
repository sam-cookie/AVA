ALTER TABLE `categories` ADD `archived_at` integer;
--> statement-breakpoint
ALTER TABLE `funds` ADD `archived_at` integer;
--> statement-breakpoint
ALTER TABLE `goal_contributions` ADD `archived_at` integer;
--> statement-breakpoint
ALTER TABLE `savings_goals` ADD `archived_at` integer;
--> statement-breakpoint
ALTER TABLE `sources` ADD `archived_at` integer;
--> statement-breakpoint
ALTER TABLE `transactions` ADD `archived_at` integer;
--> statement-breakpoint
ALTER TABLE `transfers` ADD `archived_at` integer;
--> statement-breakpoint
ALTER TABLE `utang` ADD `archived_at` integer;
--> statement-breakpoint
ALTER TABLE `utang_payments` ADD `archived_at` integer;
