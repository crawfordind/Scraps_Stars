import { z } from "zod";

export const coachBriefingSchema = z.object({
  greeting: z.string().min(1),
  personalized_hook: z.string().min(1),
  next_best_action: z.string().min(1),
  food_security_tip: z.string().min(1),
  fun_challenge: z.string().min(1),
  score_label: z.string().min(1),
});

export type CoachBriefing = z.infer<typeof coachBriefingSchema>;

export type PantryProfile = {
  staples: string[];
  recentScanIngredients: string[];
  favoriteChefId: string | null;
  tierHabit: "pantry" | "balanced" | "feast";
  mealsSecured: number;
};

export type CoachTrigger = "welcome" | "recipe_saved" | "stale_refresh" | "level_up";

export type CoachSnapshot = {
  briefing: CoachBriefing;
  foodSecurityScore: number;
  pantryProfile: PantryProfile;
  generatedAt: Date;
  triggerEvent: CoachTrigger;
  isStale: boolean;
};
