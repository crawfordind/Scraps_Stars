import { buildFallbackBriefing } from "@/lib/coach/fallbackBriefing";
import { buildPantryProfile } from "@/lib/coach/pantryProfile";
import { computeFoodSecurityScore } from "@/lib/coach/securityScore";
import type { CoachBriefing, CoachSnapshot, CoachTrigger, PantryProfile } from "@/lib/coach/types";
import { getUserInventoryNames } from "@/lib/db/inventory";
import {
  getCoachContext,
  isCoachStale,
  parseCoachContext,
  saveCoachContext,
} from "@/lib/db/coach";
import { getSavedRecipeSummaries } from "@/lib/db/recipes";
import { DEMO_USER_ID, getUserProfile } from "@/lib/db/user";
import { generateCoachBriefing } from "@/lib/llm/openrouter";

const LLM_TRIGGERS: CoachTrigger[] = ["recipe_saved", "stale_refresh", "level_up"];

function shouldUseLlm(trigger: CoachTrigger, hasHistory: boolean): boolean {
  if (!hasHistory) return false;
  return LLM_TRIGGERS.includes(trigger);
}

export async function assembleCoachSnapshot(
  userId: string = DEMO_USER_ID,
  options?: { allowStale?: boolean },
): Promise<CoachSnapshot> {
  const user = await getUserProfile(userId);
  const saved = await getSavedRecipeSummaries(userId);
  const inventory = await getUserInventoryNames(userId);

  const uniqueIngredients = new Set<string>();
  let tier1 = 0;
  const chefCounts = new Map<string, number>();

  for (const recipe of saved) {
    if (recipe.tier === 1) tier1++;
    chefCounts.set(recipe.chefId, (chefCounts.get(recipe.chefId) ?? 0) + 1);
    for (const ing of recipe.pantryIngredients) uniqueIngredients.add(ing.toLowerCase());
  }

  const favoriteChefId =
    [...chefCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? user?.selectedChefId ?? null;

  const pantryProfile = buildPantryProfile({
    savedRecipes: saved.map((r) => ({
      chefId: r.chefId,
      tier: r.tier,
      pantryIngredients: r.pantryIngredients,
    })),
    currentInventory: inventory,
    favoriteChefId,
  });

  const foodSecurityScore = computeFoodSecurityScore({
    mealsSaved: saved.length,
    uniqueIngredients: uniqueIngredients.size,
    currentPantryCount: inventory.length,
    tier1Ratio: saved.length > 0 ? tier1 / saved.length : 0,
    level: user?.level ?? 1,
  });

  const stored = await getCoachContext(userId);
  const hasHistory = saved.length > 0 || inventory.length > 0;

  if (stored) {
    const parsed = parseCoachContext(stored);
    return {
      briefing: parsed.briefing,
      foodSecurityScore,
      pantryProfile: parsed.pantryProfile ?? pantryProfile,
      generatedAt: parsed.generatedAt,
      triggerEvent: parsed.triggerEvent,
      isStale: options?.allowStale !== false && isCoachStale(parsed.generatedAt),
    };
  }

  const briefing = buildFallbackBriefing({
    userName: user?.name ?? "Chef",
    foodSecurityScore,
    pantryProfile,
    mealsSaved: saved.length,
    level: user?.level ?? 1,
  });

  await saveCoachContext({
    userId,
    briefing,
    pantryProfile,
    foodSecurityScore,
    triggerEvent: "welcome",
  });

  return {
    briefing,
    foodSecurityScore,
    pantryProfile,
    generatedAt: new Date(),
    triggerEvent: "welcome",
    isStale: hasHistory,
  };
}

export async function refreshCoachBriefing(
  userId: string = DEMO_USER_ID,
  trigger: CoachTrigger,
): Promise<{ snapshot: CoachSnapshot; usedLlm: boolean }> {
  const user = await getUserProfile(userId);
  const saved = await getSavedRecipeSummaries(userId);
  const inventory = await getUserInventoryNames(userId);
  const hasHistory = saved.length > 0 || inventory.length > 0;

  const uniqueIngredients = new Set<string>();
  let tier1 = 0;
  const chefCounts = new Map<string, number>();

  for (const recipe of saved) {
    if (recipe.tier === 1) tier1++;
    chefCounts.set(recipe.chefId, (chefCounts.get(recipe.chefId) ?? 0) + 1);
    for (const ing of recipe.pantryIngredients) uniqueIngredients.add(ing.toLowerCase());
  }

  const favoriteChefId =
    [...chefCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? user?.selectedChefId ?? null;

  const pantryProfile = buildPantryProfile({
    savedRecipes: saved.map((r) => ({
      chefId: r.chefId,
      tier: r.tier,
      pantryIngredients: r.pantryIngredients,
    })),
    currentInventory: inventory,
    favoriteChefId,
  });

  const foodSecurityScore = computeFoodSecurityScore({
    mealsSaved: saved.length,
    uniqueIngredients: uniqueIngredients.size,
    currentPantryCount: inventory.length,
    tier1Ratio: saved.length > 0 ? tier1 / saved.length : 0,
    level: user?.level ?? 1,
  });

  let briefing: CoachBriefing;
  let usedLlm = false;

  if (shouldUseLlm(trigger, hasHistory)) {
    try {
      const result = await generateCoachBriefing({
        userName: user?.name ?? "Chef",
        level: user?.level ?? 1,
        foodSecurityScore,
        pantryProfile,
        mealsSaved: saved.length,
        favoriteChefId,
        trigger,
      });
      briefing = result.data;
      usedLlm = true;
    } catch {
      briefing = buildFallbackBriefing({
        userName: user?.name ?? "Chef",
        foodSecurityScore,
        pantryProfile,
        mealsSaved: saved.length,
        level: user?.level ?? 1,
      });
    }
  } else {
    briefing = buildFallbackBriefing({
      userName: user?.name ?? "Chef",
      foodSecurityScore,
      pantryProfile,
      mealsSaved: saved.length,
      level: user?.level ?? 1,
    });
  }

  const generatedAt = await saveCoachContext({
    userId,
    briefing,
    pantryProfile,
    foodSecurityScore,
    triggerEvent: trigger,
  });

  return {
    snapshot: {
      briefing,
      foodSecurityScore,
      pantryProfile,
      generatedAt,
      triggerEvent: trigger,
      isStale: false,
    },
    usedLlm,
  };
}
