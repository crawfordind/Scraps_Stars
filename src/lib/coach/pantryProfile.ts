import { getChefById } from "@/lib/chefs/personas";
import type { PantryProfile } from "@/lib/coach/types";
import type { Tier } from "@/lib/llm/types";

type RecipeRow = {
  chefId: string;
  tier: Tier;
  pantryIngredients: string[];
};

export function buildPantryProfile(args: {
  savedRecipes: RecipeRow[];
  currentInventory: string[];
  favoriteChefId: string | null;
}): PantryProfile {
  const freq = new Map<string, number>();
  const tierCounts = { 1: 0, 2: 0, 3: 0 };

  for (const recipe of args.savedRecipes) {
    tierCounts[recipe.tier]++;
    for (const ing of recipe.pantryIngredients) {
      const key = ing.toLowerCase();
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
  }

  const staples = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => k);

  const totalTiers = tierCounts[1] + tierCounts[2] + tierCounts[3];
  let tierHabit: PantryProfile["tierHabit"] = "balanced";
  if (totalTiers > 0) {
    if (tierCounts[1] / totalTiers > 0.55) tierHabit = "pantry";
    else if (tierCounts[3] / totalTiers > 0.4) tierHabit = "feast";
  }

  return {
    staples,
    recentScanIngredients: args.currentInventory.slice(0, 12),
    favoriteChefId: args.favoriteChefId,
    tierHabit,
    mealsSecured: args.savedRecipes.length,
  };
}

export function chefNameForProfile(profile: PantryProfile): string {
  if (!profile.favoriteChefId) return "your chef coach";
  return getChefById(profile.favoriteChefId)?.name ?? "your chef coach";
}
