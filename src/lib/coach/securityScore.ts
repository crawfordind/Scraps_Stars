import type { PantryProfile } from "@/lib/coach/types";

export type SecurityInputs = {
  mealsSaved: number;
  uniqueIngredients: number;
  currentPantryCount: number;
  tier1Ratio: number;
  level: number;
};

export function computeFoodSecurityScore(inputs: SecurityInputs): number {
  const mealScore = Math.min(inputs.mealsSaved * 6, 30);
  const varietyScore = Math.min(inputs.uniqueIngredients * 2, 24);
  const pantryScore = Math.min(inputs.currentPantryCount * 2, 20);
  const zeroWasteBonus = Math.round(inputs.tier1Ratio * 16);
  const levelBonus = Math.min(inputs.level * 2, 10);

  return Math.min(100, Math.round(mealScore + varietyScore + pantryScore + zeroWasteBonus + levelBonus));
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Food Secure";
  if (score >= 70) return "Pantry Resilient";
  if (score >= 50) return "Building Momentum";
  if (score >= 30) return "Getting Started";
  return "First Steps";
}

export function securityRingMessage(score: number, profile: PantryProfile): string {
  if (score >= 85) {
    return `Your pantry covers ${profile.mealsSecured}+ meal patterns — you're eating well from what you have.`;
  }
  if (score >= 50) {
    return `${profile.staples.slice(0, 3).join(", ") || "Your staples"} are your safety net. One scan away from another win.`;
  }
  return "Every saved recipe strengthens your kitchen against waste and uncertainty.";
}
