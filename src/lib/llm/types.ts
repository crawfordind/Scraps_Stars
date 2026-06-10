import { z } from "zod";
import { normalizeDifficulty } from "./normalize";

export const tierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const recipeSchema = z.object({
  recipe_name: z.string().min(1),
  flavor_profile_explanation: z.string().min(1),
  estimated_time_minutes: z.number().int().nonnegative(),
  difficulty: z.enum(["Beginner", "Intermediate", "Master"]),
  ingredients_pantry: z.array(z.string()),
  ingredients_shopping_list: z.array(z.string()),
  steps: z.array(z.string()).min(1),
  xp_reward: z.number().int().nonnegative(),
  chef_commentary: z.string().optional(),
  chef_waste_tip: z.string().optional(),
});

export const inventoryExtractionSchema = z.object({
  ingredients: z
    .array(
      z.object({
        ingredientName: z.string().min(1),
        quantity: z.string().optional(),
        isSpice: z.boolean().default(false),
      }),
    )
    .min(0),
  confidence: z.number().min(0).max(1).optional(),
});

export type Tier = z.infer<typeof tierSchema>;
export type RecipeOutput = z.infer<typeof recipeSchema>;
export type InventoryExtractionOutput = z.infer<typeof inventoryExtractionSchema>;

export const coachBriefingLlmSchema = z.object({
  greeting: z.string().min(1),
  personalized_hook: z.string().min(1),
  next_best_action: z.string().min(1),
  food_security_tip: z.string().min(1),
  fun_challenge: z.string().min(1),
  score_label: z.string().min(1),
});

export type CoachBriefingLlm = z.infer<typeof coachBriefingLlmSchema>;

export type LlmRequestMeta = {
  model: string;
  latencyMs: number;
  fallbackUsed: boolean;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd: number;
};

// Re-export for any legacy imports
export { normalizeDifficulty };
