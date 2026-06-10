import { recipeSchema } from "../src/lib/llm/types";
import { challengeEntryScoreSchema, computeChallengeEntryScore } from "../src/lib/scoring/challengeScore";
import { identitySchema } from "../src/lib/identity/session";

function assert(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`, err);
    process.exitCode = 1;
  }
}

assert("revise-recipe schema accepts valid recipe", () => {
  recipeSchema.parse({
    recipe_name: "Test",
    flavor_profile_explanation: "Savory pantry bowl",
    estimated_time_minutes: 20,
    difficulty: "Beginner",
    ingredients_pantry: ["rice"],
    ingredients_shopping_list: [],
    steps: ["Cook rice"],
    xp_reward: 40,
  });
});

assert("challenge entry score schema", () => {
  const scored = computeChallengeEntryScore({
    recipe: {
      recipe_name: "Test",
      flavor_profile_explanation: "Good",
      estimated_time_minutes: 15,
      difficulty: "Beginner",
      ingredients_pantry: ["eggs", "spinach", "cheese"],
      ingredients_shopping_list: [],
      steps: ["Mix and cook"],
      xp_reward: 30,
    },
    tier: 1,
    nailedIt: true,
    foodSecurityScore: 72,
  });
  challengeEntryScoreSchema.parse(scored);
});

assert("identity schema rejects invalid handle", () => {
  const result = identitySchema.safeParse({ handle: "AB", avatarEmoji: "🍳" });
  if (result.success) throw new Error("Expected validation failure");
});

assert("identity schema accepts valid handle", () => {
  identitySchema.parse({ handle: "wickedsowa", avatarEmoji: "🌶️" });
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("All schema tests passed.");
