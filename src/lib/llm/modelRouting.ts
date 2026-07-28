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

/** Free tier — every task routes exclusively to openrouter/free (primary + fallback). */
export const FREE_ROUTING: Record<TaskKind, ModelRoute> = {
  inventory_extract: {
    primary: "openrouter/free",
    fallback: "openrouter/free",
  },
  recipe_generate: {
    primary: "openrouter/free",
    fallback: "openrouter/free",
  },
  recipe_revise: {
    primary: "openrouter/free",
    fallback: "openrouter/free",
  },
  coach_briefing: {
    primary: "openrouter/free",
    fallback: "openrouter/free",
  },
};

/**
 * Hard lock: force every OpenRouter call to openrouter/free, ignoring the
 * OPENROUTER_USE_FREE_MODELS env var. Flip to false to restore env-based routing
 * (and the paid PRODUCTION_ROUTING models above).
 */
export const FORCE_FREE_MODELS = true;

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
  if (FORCE_FREE_MODELS) return FREE_ROUTING[task];
  return useFreeModels() ? FREE_ROUTING[task] : PRODUCTION_ROUTING[task];
}
