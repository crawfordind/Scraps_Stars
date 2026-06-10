import type { RecipeOutput, Tier } from "@/lib/llm/types";

const TIER_LABELS: Record<Tier, string> = {
  1: "Strictly Here",
  2: "Bridge the Gap",
  3: "Full Feast",
};

type RecipeReadOnlyProps = {
  recipe: RecipeOutput;
  chefName: string;
  tier: Tier;
};

export function RecipeReadOnly({ recipe, chefName, tier }: RecipeReadOnlyProps) {
  return (
    <section className="panel recipe-readonly">
      <p className="recipe-readonly__flavor">{recipe.flavor_profile_explanation}</p>
      <p className="recipe-readonly__meta">
        {chefName} · {TIER_LABELS[tier]} · {recipe.estimated_time_minutes} min · {recipe.difficulty}
      </p>

      <div className="recipe-readonly__columns">
        <div>
          <h3>From pantry</h3>
          <ul>
            {recipe.ingredients_pantry.map((item, i) => (
              <li key={`p-${i}`}>{item}</li>
            ))}
          </ul>
        </div>
        {recipe.ingredients_shopping_list.length > 0 && (
          <div>
            <h3>Shopping list</h3>
            <ul>
              {recipe.ingredients_shopping_list.map((item, i) => (
                <li key={`s-${i}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <h3>Method</h3>
      <ol>
        {recipe.steps.map((step, i) => (
          <li key={`step-${i}`}>{step}</li>
        ))}
      </ol>

      {recipe.chef_waste_tip && (
        <p className="recipe-readonly__tip">
          <strong>Zero-waste tip:</strong> {recipe.chef_waste_tip}
        </p>
      )}
    </section>
  );
}
