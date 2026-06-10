ALTER TABLE `saved_recipes` ADD `share_id` text;
--> statement-breakpoint
UPDATE `saved_recipes` SET `share_id` = lower(hex(randomblob(6))) || lower(hex(randomblob(6))) WHERE `share_id` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_recipes_share_id_unique` ON `saved_recipes` (`share_id`);
--> statement-breakpoint
CREATE INDEX `saved_recipes_share_id_idx` ON `saved_recipes` (`share_id`);
--> statement-breakpoint
ALTER TABLE `saved_recipes` ADD `plated_photo_url` text;
--> statement-breakpoint
ALTER TABLE `saved_recipes` ADD `nailed_it` integer;
