import type { ChefPersona } from "@/lib/chefs/personas";
import { CHEF_PERSONAS } from "@/lib/chefs/personas";
import type { Tier } from "@/lib/llm/types";

export type SavedRecipeSummary = {
  chefId: string;
  tier: Tier;
  recipeName: string;
  pantryIngredients: string[];
  flavorProfile: string;
};

export type RecommendationResult = {
  suggestedChefId: string;
  suggestedTier: Tier;
  reason: string;
  flavorHints: string[];
  excludeIngredients: string[];
};

const SPICE_KEYWORDS = ["cumin", "turmeric", "coriander", "masala", "chili", "pepper", "paprika"];
const VEG_KEYWORDS = ["lettuce", "tomato", "carrot", "broccoli", "spinach", "pepper", "onion", "garlic"];
const ASIAN_KEYWORDS = ["soy", "ginger", "miso", "rice", "noodle", "sesame", "fish sauce"];

function scoreChefForInventory(chef: ChefPersona, ingredients: string[]): number {
  const lower = ingredients.map((i) => i.toLowerCase()).join(" ");
  let score = 0;

  if (chef.id === "khanna" && SPICE_KEYWORDS.some((k) => lower.includes(k))) score += 3;
  if (chef.id === "ottolenghi" && VEG_KEYWORDS.filter((k) => lower.includes(k)).length >= 2) score += 3;
  if (chef.id === "nakayama" && ASIAN_KEYWORDS.some((k) => lower.includes(k))) score += 2;
  if (chef.id === "waters" && VEG_KEYWORDS.some((k) => lower.includes(k))) score += 2;
  if (chef.id === "bottura") score += 1;
  if (chef.id === "redzepi" && lower.includes("pickle")) score += 2;

  return score;
}

export function buildRecommendations(args: {
  currentInventory: string[];
  savedRecipes: SavedRecipeSummary[];
  currentChefId?: string;
}): RecommendationResult {
  const { currentInventory, savedRecipes, currentChefId } = args;

  const chefCounts = new Map<string, number>();
  const tierCounts = new Map<Tier, number>();
  const pantryFreq = new Map<string, number>();
  const flavors: string[] = [];

  for (const recipe of savedRecipes) {
    chefCounts.set(recipe.chefId, (chefCounts.get(recipe.chefId) ?? 0) + 1);
    tierCounts.set(recipe.tier, (tierCounts.get(recipe.tier) ?? 0) + 1);
    if (recipe.flavorProfile) flavors.push(recipe.flavorProfile.slice(0, 120));
    for (const ing of recipe.pantryIngredients) {
      const key = ing.toLowerCase();
      pantryFreq.set(key, (pantryFreq.get(key) ?? 0) + 1);
    }
  }

  let suggestedChefId = currentChefId ?? "bottura";
  let reason = "Massimo Bottura is a great default for zero-waste creativity.";

  if (savedRecipes.length > 0) {
    const topChef = [...chefCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topChef) {
      const chef = CHEF_PERSONAS.find((c) => c.id === topChef[0]);
      suggestedChefId = topChef[0];
      reason = chef
        ? `You've loved ${chef.name}'s style — ${topChef[1]} saved recipe${topChef[1] > 1 ? "s" : ""}.`
        : "Based on your saved favorites.";
    }
  } else if (currentInventory.length > 0) {
    const scored = CHEF_PERSONAS.map((chef) => ({
      chef,
      score: scoreChefForInventory(chef, currentInventory),
    })).sort((a, b) => b.score - a.score);

    if (scored[0].score > 0) {
      suggestedChefId = scored[0].chef.id;
      reason = `${scored[0].chef.name} matches your pantry — ${scored[0].chef.specialty.toLowerCase()}.`;
    }
  }

  let suggestedTier: Tier = 1;
  if (tierCounts.size > 0) {
    const topTier = [...tierCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topTier) suggestedTier = topTier[0];
  } else if (currentInventory.length >= 8) {
    suggestedTier = 2;
    reason += " Rich pantry — Bridge the Gap could unlock something special.";
  } else if (currentInventory.length <= 3) {
    suggestedTier = 1;
    reason += " Lean pantry — Strictly Here keeps waste at zero.";
  }

  const lovedIngredients = [...pantryFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  const overlap = currentInventory
    .map((i) => i.toLowerCase())
    .filter((i) => lovedIngredients.some((l) => i.includes(l) || l.includes(i)));

  const flavorHints = flavors.slice(0, 3);
  if (overlap.length > 0) {
    flavorHints.push(`You often cook with ${overlap.slice(0, 3).join(", ")}`);
  }

  return {
    suggestedChefId,
    suggestedTier,
    reason,
    flavorHints,
    excludeIngredients: [],
  };
}
