ALTER TABLE `users` ADD `selected_chef_id` text DEFAULT 'bottura';
--> statement-breakpoint
CREATE TABLE `saved_recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`recipe_name` text NOT NULL,
	`recipe_json` text NOT NULL,
	`chef_id` text NOT NULL,
	`tier` integer NOT NULL,
	`inventory_snapshot` text,
	`liked` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
