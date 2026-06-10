import type { RecipeOutput } from "@/lib/llm/types";
import type { RecipeStep } from "@/lib/state/cookingTypes";

const TIMER_PATTERNS: Array<{ regex: RegExp; toSeconds: (match: RegExpMatchArray) => number }> = [
  { regex: /(\d+)\s*hours?(?:\s+(\d+)\s*min)?/i, toSeconds: (m) => Number(m[1]) * 3600 + Number(m[2] ?? 0) * 60 },
  { regex: /(\d+)\s*hr(?:\s+(\d+)\s*m)?/i, toSeconds: (m) => Number(m[1]) * 3600 + Number(m[2] ?? 0) * 60 },
  { regex: /(\d+)\s*minutes?/i, toSeconds: (m) => Number(m[1]) * 60 },
  { regex: /(\d+)\s*mins?/i, toSeconds: (m) => Number(m[1]) * 60 },
  { regex: /(\d+)\s*seconds?/i, toSeconds: (m) => Number(m[1]) },
  { regex: /(\d+)\s*secs?/i, toSeconds: (m) => Number(m[1]) },
];

export function extractTimerFromText(text: string): { seconds: number; label: string } | null {
  for (const { regex, toSeconds } of TIMER_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const seconds = toSeconds(match);
      if (seconds > 0) return { seconds, label: match[0] };
    }
  }
  return null;
}

function splitStepText(text: string): { headline: string; detail?: string } {
  const trimmed = text.trim();
  const sentenceEnd = trimmed.search(/[.!?]\s+/);
  if (sentenceEnd > 0 && sentenceEnd < 80) {
    return {
      headline: trimmed.slice(0, sentenceEnd + 1),
      detail: trimmed.slice(sentenceEnd + 2).trim() || undefined,
    };
  }
  if (trimmed.length > 90) {
    const cut = trimmed.lastIndexOf(" ", 90);
    return {
      headline: trimmed.slice(0, cut > 40 ? cut : 90),
      detail: trimmed.slice(cut > 40 ? cut + 1 : 90).trim() || undefined,
    };
  }
  return { headline: trimmed };
}

export function normalizeRecipeToSteps(recipe: RecipeOutput, recipeId: string): RecipeStep[] {
  return recipe.steps.map((stepText, index) => {
    const { headline, detail } = splitStepText(stepText);
    const timer = extractTimerFromText(stepText);
    return {
      id: `${recipeId}-step-${index}`,
      order: index,
      headline,
      detail,
      timerSeconds: timer?.seconds,
      timerLabel: timer?.label,
    };
  });
}

export function normalizeIngredients(recipe: RecipeOutput, recipeId: string) {
  return recipe.ingredients_pantry.map((name, index) => ({
    id: `${recipeId}-ing-${index}`,
    name,
    amount: "",
    checked: false,
  }));
}
