import { generateRecipe } from "../src/lib/llm/openrouter";

async function main() {
  const result = await generateRecipe({
    inventoryList: ["eggs", "chicken", "spinach", "greek yogurt", "salsa", "zucchini"],
    preferences: [],
    tier: 1,
  });
  console.log("OK:", result.data.recipe_name);
  console.log("Difficulty:", result.data.difficulty);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
