import { chefNameForProfile } from "@/lib/coach/pantryProfile";
import { scoreLabel, securityRingMessage } from "@/lib/coach/securityScore";
import type { CoachBriefing, PantryProfile } from "@/lib/coach/types";

export function buildFallbackBriefing(args: {
  userName: string;
  foodSecurityScore: number;
  pantryProfile: PantryProfile;
  mealsSaved: number;
  level: number;
}): CoachBriefing {
  const chef = chefNameForProfile(args.pantryProfile);
  const ring = securityRingMessage(args.foodSecurityScore, args.pantryProfile);

  if (args.mealsSaved === 0) {
    return {
      greeting: `Hey ${args.userName} — you have more than you think.`,
      personalized_hook: ring,
      next_best_action: "Show me the sad shelf.",
      food_security_tip: "Rice, eggs, and onions in the same kitchen = 3+ emergency meals. Know your anchors.",
      fun_challenge: "Can you pull off strictly here — pantry only — on your first round?",
      score_label: scoreLabel(args.foodSecurityScore),
    };
  }

  const stapleLine =
    args.pantryProfile.staples.length > 0
      ? `You keep coming back to ${args.pantryProfile.staples.slice(0, 3).join(", ")}.`
      : "Your larder is taking shape.";

  return {
    greeting: `${args.userName}, Level ${args.level} — ${chef} has your back.`,
    personalized_hook: `${stapleLine} ${ring}`,
    next_best_action:
      args.pantryProfile.recentScanIngredients.length > 0
        ? "Your last scan is still fresh — cook what's left before it goes."
        : "Open the fridge, let's work with it.",
    food_security_tip:
      args.pantryProfile.tierHabit === "pantry"
        ? "Strictly-here cooking = maximum security with zero extra spend."
        : "Rotate one use-first ingredient each week before buying more.",
    fun_challenge:
      args.pantryProfile.tierHabit === "feast"
        ? "Try a strictly here round — zero shopping, pure ingenuity."
        : `Save one more feast to push your score toward ${Math.min(100, args.foodSecurityScore + 8)}.`,
    score_label: scoreLabel(args.foodSecurityScore),
  };
}
