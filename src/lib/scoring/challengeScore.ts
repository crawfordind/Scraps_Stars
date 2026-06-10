import { z } from "zod";
import type { RecipeOutput } from "@/lib/llm/types";
import { computeRecipeImpact } from "@/lib/impact/calculator";

export const challengeEntryScoreSchema = z.object({
  score: z.number().int().min(0).max(1000),
  breakdown: z.object({
    impactPoints: z.number().int().nonnegative(),
    verdictPoints: z.number().int().nonnegative(),
    securityPoints: z.number().int().nonnegative(),
  }),
});

export type ChallengeEntryScore = z.infer<typeof challengeEntryScoreSchema>;

export function computeChallengeEntryScore(args: {
  recipe: RecipeOutput;
  tier: 1 | 2 | 3;
  nailedIt: boolean;
  foodSecurityScore: number;
}): ChallengeEntryScore {
  const impact = computeRecipeImpact(args.recipe, args.tier);
  const impactPoints = Math.round(impact.foodRescuedKg * 20 + impact.co2SavedKg * 5);
  const verdictPoints = args.nailedIt ? 120 : 40;
  const securityPoints = Math.round(args.foodSecurityScore * 0.5);
  const score = impactPoints + verdictPoints + securityPoints;

  return challengeEntryScoreSchema.parse({
    score,
    breakdown: { impactPoints, verdictPoints, securityPoints },
  });
}
