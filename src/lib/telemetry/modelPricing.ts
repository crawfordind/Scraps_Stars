/** Per-million-token USD rates (input / output) — OpenRouter list prices. */
export const MODEL_PRICING_PER_MILLION: Record<string, { input: number; output: number }> = {
  "google/gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "deepseek/deepseek-v4-flash": { input: 0.0983, output: 0.1966 },
  "openrouter/free": { input: 0, output: 0 },
  "google/gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export const DEFAULT_PRICING = { input: 0.1, output: 0.4 };

export function isFreeModel(model: string): boolean {
  return model === "openrouter/free" || model.endsWith(":free");
}

export function getModelPricing(model: string) {
  if (isFreeModel(model)) {
    return { input: 0, output: 0 };
  }
  return MODEL_PRICING_PER_MILLION[model] ?? DEFAULT_PRICING;
}
