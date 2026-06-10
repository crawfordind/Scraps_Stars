CREATE TABLE `user_coach_context` (
	`user_id` text PRIMARY KEY NOT NULL,
	`briefing_json` text NOT NULL,
	`pantry_profile_json` text,
	`food_security_score` integer DEFAULT 50 NOT NULL,
	`generated_at` integer NOT NULL,
	`trigger_event` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
