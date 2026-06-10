ALTER TABLE `users` ADD `handle` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_emoji` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `auth_token` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_handle_unique` ON `users` (`handle`);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_auth_token_unique` ON `users` (`auth_token`);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`theme` text NOT NULL,
	`prompt` text NOT NULL,
	`constraints` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `challenge_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`challenge_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`score` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipe_id`) REFERENCES `saved_recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `challenge_entries_user_challenge_unique` ON `challenge_entries` (`user_id`,`challenge_id`);
