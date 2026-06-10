import { generateRecipe, extractInventoryFromImage } from "../src/lib/llm/openrouter";

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Set OPENROUTER_API_KEY before running tests");
  }

  console.log("Testing recipe generation (deepseek/deepseek-v4-flash)...");
  const recipe = await generateRecipe({
    inventoryList: ["eggs", "spinach", "feta", "olive oil"],
    preferences: ["mushrooms"],
    tier: 1,
  });
  console.log("Recipe:", recipe.data.recipe_name);
  console.log("Meta:", recipe.meta);

  console.log("\nTesting inventory extraction (google/gemini-2.5-flash-lite)...");
  const tinyPng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const extract = await extractInventoryFromImage({ imageUrl: tinyPng });
  console.log("Ingredients found:", extract.data.ingredients.length);
  console.log("Meta:", extract.meta);

  const totalCost = recipe.meta.estimatedCostUsd + extract.meta.estimatedCostUsd;
  console.log(`\nTotal test cost estimate: $${totalCost.toFixed(6)}`);
  console.log(`$1 budget ≈ ${Math.floor(1 / totalCost)} full cycles at this rate`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
