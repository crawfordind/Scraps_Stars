CREATE TABLE `cook_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`user_id` text NOT NULL,
	`step_index` integer DEFAULT 0 NOT NULL,
	`completed_steps` text NOT NULL,
	`timers` text NOT NULL,
	`started_at` integer NOT NULL,
	`status` text NOT NULL,
	`verdict` text,
	FOREIGN KEY (`recipe_id`) REFERENCES `saved_recipes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
