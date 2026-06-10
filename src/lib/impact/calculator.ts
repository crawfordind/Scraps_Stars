import { getChefById } from "@/lib/chefs/personas";
import type { RecipeOutput, Tier } from "@/lib/llm/types";

const KG_PER_PANTRY_ITEM = 0.15;
const USD_PER_MEAL = 8.5;
const CO2_KG_PER_KG_FOOD = 2.5;

export type RecipeImpactStats = {
  foodRescuedKg: number;
  moneySavedUsd: number;
  co2SavedKg: number;
};

/** Per-recipe impact estimates for share cards and challenge scoring. */
export function computeRecipeImpact(recipe: RecipeOutput, _tier: Tier): RecipeImpactStats {
  const pantryItems = recipe.ingredients_pantry.length;
  const foodRescuedKg = Math.round(pantryItems * KG_PER_PANTRY_ITEM * 10) / 10;
  return {
    foodRescuedKg,
    moneySavedUsd: Math.round(USD_PER_MEAL * 10) / 10,
    co2SavedKg: Math.round(foodRescuedKg * CO2_KG_PER_KG_FOOD * 10) / 10,
  };
}

export type ImpactRecipeInput = {
  recipeName: string;
  recipe: RecipeOutput;
  chefId: string;
  tier: Tier;
  inventorySnapshot: string[];
  createdAt: Date;
};

export type ImpactStats = {
  mealsSaved: number;
  ingredientsRescued: number;
  pantryItemsUsed: number;
  foodRescuedKg: number;
  moneySavedUsd: number;
  co2SavedKg: number;
  waterSavedLiters: number;
  xpEarned: number;
  level: number;
  favoriteChefId: string | null;
  favoriteChefName: string | null;
  tierBreakdown: Record<Tier, number>;
};

export type DashboardInsight = {
  headline: string;
  detail: string;
  action: string;
};

const LITERS_WATER_PER_KG_FOOD = 1000;
const GLOBAL_ANNUAL_WASTE_TONS = 1_300_000_000;
const TYPICAL_WEEKLY_SHOP_KG = 12;

export function computeImpact(
  recipes: ImpactRecipeInput[],
  user: { xp: number; level: number },
): ImpactStats {
  const uniqueIngredients = new Set<string>();
  let pantryItemsUsed = 0;
  const tierBreakdown: Record<Tier, number> = { 1: 0, 2: 0, 3: 0 };
  const chefCounts = new Map<string, number>();

  for (const entry of recipes) {
    tierBreakdown[entry.tier]++;
    chefCounts.set(entry.chefId, (chefCounts.get(entry.chefId) ?? 0) + 1);
    for (const ing of entry.recipe.ingredients_pantry) {
      uniqueIngredients.add(ing.toLowerCase());
      pantryItemsUsed++;
    }
  }

  const foodRescuedKg = Math.round(pantryItemsUsed * KG_PER_PANTRY_ITEM * 10) / 10;
  const mealsSaved = recipes.length;

  const topChef = [...chefCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const favoriteChef = topChef ? getChefById(topChef[0]) : null;

  return {
    mealsSaved,
    ingredientsRescued: uniqueIngredients.size,
    pantryItemsUsed,
    foodRescuedKg,
    moneySavedUsd: Math.round(mealsSaved * USD_PER_MEAL * 10) / 10,
    co2SavedKg: Math.round(foodRescuedKg * CO2_KG_PER_KG_FOOD * 10) / 10,
    waterSavedLiters: Math.round(foodRescuedKg * LITERS_WATER_PER_KG_FOOD),
    xpEarned: user.xp,
    level: user.level,
    favoriteChefId: favoriteChef?.id ?? null,
    favoriteChefName: favoriteChef?.name ?? null,
    tierBreakdown,
  };
}

export function globalWasteContext(foodRescuedKg: number) {
  const globalKg = GLOBAL_ANNUAL_WASTE_TONS * 1000;
  const yourSharePercent = globalKg > 0 ? (foodRescuedKg / globalKg) * 100 : 0;
  const weeklyShopPercent =
    TYPICAL_WEEKLY_SHOP_KG > 0 ? Math.round((foodRescuedKg / TYPICAL_WEEKLY_SHOP_KG) * 100) : 0;

  return {
    globalAnnualWasteTons: GLOBAL_ANNUAL_WASTE_TONS,
    householdWastePercent: 40,
    yourSharePercent,
    weeklyShopPercent: Math.min(weeklyShopPercent, 100),
  };
}

export function buildDashboardInsights(stats: ImpactStats): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const global = globalWasteContext(stats.foodRescuedKg);

  if (stats.mealsSaved === 0) {
    insights.push({
      headline: "Your impact story starts with one fridge scan",
      detail: "Globally, ~40% of food never gets eaten. One saved recipe keeps good ingredients on your plate instead of in the bin.",
      action: "Play a round and save a recipe you love",
    });
    return insights;
  }

  insights.push({
    headline: `${stats.foodRescuedKg} kg of food given a second life`,
    detail: `That's roughly ${global.weeklyShopPercent}% of a typical weekly shop kept out of the waste stream.`,
    action: "Save another recipe to grow your streak",
  });

  if (stats.favoriteChefName) {
    insights.push({
      headline: `${stats.favoriteChefName} is your go-to coach`,
      detail: `Your saved recipes show a taste for their style — we'll keep tailoring picks to match.`,
      action: "Try a new chef for a fresh perspective",
    });
  }

  if (stats.tierBreakdown[1] > stats.tierBreakdown[2] + stats.tierBreakdown[3]) {
    insights.push({
      headline: "Pantry-only champion",
      detail: "You gravitate toward zero-shopping recipes — maximum waste reduction, minimum spend.",
      action: "Challenge yourself with Bridge the Gap",
    });
  }

  insights.push({
    headline: `$${stats.moneySavedUsd} estimated grocery savings`,
    detail: `Plus ~${stats.co2SavedKg} kg CO₂ and ${stats.waterSavedLiters.toLocaleString()} L water not lost to waste.`,
    action: "View your saved recipes below",
  });

  return insights;
}
