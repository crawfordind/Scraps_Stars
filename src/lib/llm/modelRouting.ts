export type TaskKind = "inventory_extract" | "recipe_generate" | "recipe_revise" | "coach_briefing";

type ModelRoute = { primary: string; fallback: string };

/** Cost-optimized production routing — ~$0.0003–0.0008 per full scan+recipe cycle. */
export const PRODUCTION_ROUTING: Record<TaskKind, ModelRoute> = {
  inventory_extract: {
    primary: "google/gemini-2.5-flash-lite",
    fallback: "google/gemini-2.5-flash-lite",
  },
  recipe_generate: {
    primary: "deepseek/deepseek-v4-flash",
    fallback: "google/gemini-2.5-flash-lite",
  },
  recipe_revise: {
    primary: "deepseek/deepseek-v4-flash",
    fallback: "google/gemini-2.5-flash-lite",
  },
  coach_briefing: {
    primary: "google/gemini-2.5-flash-lite",
    fallback: "google/gemini-2.5-flash-lite",
  },
};

/** Free tier for zero-cost local experiments. */
export const FREE_ROUTING: Record<TaskKind, ModelRoute> = {
  inventory_extract: {
    primary: "openrouter/free",
    fallback: "google/gemini-2.0-flash-exp:free",
  },
  recipe_generate: {
    primary: "openrouter/free",
    fallback: "meta-llama/llama-3.2-3b-instruct:free",
  },
  recipe_revise: {
    primary: "openrouter/free",
    fallback: "meta-llama/llama-3.2-3b-instruct:free",
  },
  coach_briefing: {
    primary: "openrouter/free",
    fallback: "google/gemini-2.0-flash-exp:free",
  },
};

export const TASK_MAX_TOKENS: Record<TaskKind, number> = {
  // Capped at 25 items; the structured payload fits comfortably under 1024 and
  // a tighter ceiling bounds worst-case cost without risking truncation.
  inventory_extract: 1024,
  recipe_generate: 768,
  recipe_revise: 768,
  coach_briefing: 320,
};

export function useFreeModels(): boolean {
  return process.env.OPENROUTER_USE_FREE_MODELS === "true";
}

export function getModelRouting(task: TaskKind): ModelRoute {
  return useFreeModels() ? FREE_ROUTING[task] : PRODUCTION_ROUTING[task];
}
