import type { TaskKind } from "./modelRouting";

/**
 * Native structured-output schemas (OpenRouter `response_format: json_schema`).
 *
 * When a provider supports it, this forces the model to emit exactly the shape
 * we parse — eliminating most malformed-JSON retries (and their token cost).
 * We still keep the json_object + repair path as a fallback for providers that
 * don't, so this is a strict upgrade, never a regression.
 *
 * Strict mode (OpenAI semantics) requires every property to be listed in
 * `required` with `additionalProperties: false`; "optional" fields are modelled
 * as nullable instead. Our normalize layer already treats null/"" as absent.
 */
export type JsonSchemaResponseFormat = {
  type: "json_schema";
  json_schema: { name: string; strict: true; schema: Record<string, unknown> };
};

const inventorySchema: JsonSchemaResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "inventory_extraction",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        ingredients: {
          type: "array",
          description: "Distinct edible items visible in the photo.",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              ingredientName: {
                type: "string",
                description: "Common, singular food name — e.g. 'egg', 'cheddar', 'spinach'. No brand names.",
              },
              quantity: {
                type: ["string", "null"],
                description: "Rough amount if obvious (e.g. '2', 'half carton'), otherwise null.",
              },
              isSpice: {
                type: "boolean",
                description: "True for spices, dried herbs, and seasonings.",
              },
            },
            required: ["ingredientName", "quantity", "isSpice"],
          },
        },
        confidence: {
          type: "number",
          description: "Overall confidence the items were read correctly, 0 to 1.",
        },
      },
      required: ["ingredients", "confidence"],
    },
  },
};

const recipeSchema: JsonSchemaResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "recipe",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        recipe_name: { type: "string" },
        flavor_profile_explanation: { type: "string" },
        estimated_time_minutes: { type: "integer" },
        difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Master"] },
        ingredients_pantry: { type: "array", items: { type: "string" } },
        ingredients_shopping_list: { type: "array", items: { type: "string" } },
        steps: { type: "array", items: { type: "string" } },
        xp_reward: { type: "integer" },
        chef_commentary: { type: "string" },
        chef_waste_tip: { type: "string" },
      },
      required: [
        "recipe_name",
        "flavor_profile_explanation",
        "estimated_time_minutes",
        "difficulty",
        "ingredients_pantry",
        "ingredients_shopping_list",
        "steps",
        "xp_reward",
        "chef_commentary",
        "chef_waste_tip",
      ],
    },
  },
};

const coachSchema: JsonSchemaResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "coach_briefing",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        greeting: { type: "string" },
        personalized_hook: { type: "string" },
        next_best_action: { type: "string" },
        food_security_tip: { type: "string" },
        fun_challenge: { type: "string" },
        score_label: { type: "string" },
      },
      required: [
        "greeting",
        "personalized_hook",
        "next_best_action",
        "food_security_tip",
        "fun_challenge",
        "score_label",
      ],
    },
  },
};

export const TASK_RESPONSE_SCHEMA: Record<TaskKind, JsonSchemaResponseFormat> = {
  inventory_extract: inventorySchema,
  recipe_generate: recipeSchema,
  recipe_revise: recipeSchema,
  coach_briefing: coachSchema,
};

/** On by default; set OPENROUTER_STRUCTURED_OUTPUTS=false to fall back to json_object only. */
export function structuredOutputsEnabled(): boolean {
  return process.env.OPENROUTER_STRUCTURED_OUTPUTS !== "false";
}
