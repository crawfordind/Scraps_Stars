import type { RecipeOutput, Tier } from "@/lib/llm/types";
import { getChefById } from "@/lib/chefs/personas";
import { computeRecipeImpact, type RecipeImpactStats } from "@/lib/impact/calculator";

const TIER_LABELS: Record<Tier, string> = {
  1: "strictly here",
  2: "bridge the gap",
  3: "full feast",
};

export type ShareCardData = {
  recipeName: string;
  chefName: string;
  chefEmoji: string;
  tier: Tier;
  tierLabel: string;
  impact: RecipeImpactStats;
  xpEarned: number;
  handle: string;
  shareId: string;
  platedPhotoUrl: string | null;
  nailedIt: boolean;
};

export function buildShareCardData(args: {
  shareId: string;
  recipe: RecipeOutput;
  chefId: string;
  tier: Tier;
  handle?: string;
  platedPhotoUrl?: string | null;
  nailedIt?: boolean;
}): ShareCardData {
  const chef = getChefById(args.chefId);
  return {
    shareId: args.shareId,
    recipeName: args.recipe.recipe_name,
    chefName: chef?.name ?? "Host",
    chefEmoji: chef?.emoji ?? "🍳",
    tier: args.tier,
    tierLabel: TIER_LABELS[args.tier],
    impact: computeRecipeImpact(args.recipe, args.tier),
    xpEarned: args.recipe.xp_reward,
    handle: args.handle ? `@${args.handle}` : "@barefeast_host",
    platedPhotoUrl: args.platedPhotoUrl ?? null,
    nailedIt: args.nailedIt ?? false,
  };
}
