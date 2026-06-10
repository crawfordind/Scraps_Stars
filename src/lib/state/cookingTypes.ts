/**
 * Cooking session types — deliberately split into two domains:
 *
 *  • UtilityState  → what the cook needs *right now* (steps, timers, ingredients)
 *  • GamificationState → progression, XP, rewards (never blocks cooking flow)
 *
 * Keeping these separate lets the Active View render from UtilityState alone
 * (fast, legible) while the Hub and Reward layers read GamificationState
 * without coupling timer ticks to XP calculations.
 */

/** A single instruction the user performs while cooking. */
export type RecipeStep = {
  id: string;
  order: number;
  /** Macro headline — readable from across the counter. */
  headline: string;
  /** Optional supporting detail; collapsed on active view by default. */
  detail?: string;
  /** Suggested timer duration in seconds (0 = no timer). */
  timerSeconds?: number;
  timerLabel?: string;
};

export type Ingredient = {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
};

/** Live timer instance — can run independently of scroll position. */
export type TimerInstance = {
  id: string;
  label: string;
  /** Total duration when started. */
  durationSeconds: number;
  /** Epoch ms when timer was started (null = paused / not started). */
  startedAt: number | null;
  /** Remaining seconds when paused (for resume). */
  remainingSeconds: number;
  status: "idle" | "running" | "paused" | "complete";
  /** Links timer to a recipe step for contextual labeling. */
  stepId?: string;
};

/** ── Utility domain ─────────────────────────────────────────────── */

export type UtilityState = {
  recipeId: string;
  recipeTitle: string;
  steps: RecipeStep[];
  currentStepIndex: number;
  timers: TimerInstance[];
  ingredients: Ingredient[];
};

/** ── Gamification domain ──────────────────────────────────────── */

export type Badge = {
  id: string;
  label: string;
  icon: string;
  earnedAt: string;
};

export type RewardKind = "step" | "recipe" | "level" | "streak" | "challenge";

/** Payload emitted when a significant action completes. */
export type RewardEvent = {
  id: string;
  kind: RewardKind;
  title: string;
  subtitle?: string;
  xpGained: number;
  /** Visual accent — maps to CSS custom property for colored shadows. */
  accent: "gold" | "accent" | "ember";
};

export type GamificationState = {
  xp: number;
  level: number;
  streak: number;
  /** 0–1 progress within current level. */
  levelProgress: number;
  badges: Badge[];
  /** Set when a reward burst should fire; cleared after animation. */
  pendingReward: RewardEvent | null;
  /** Copy for hub celebration (e.g. "Sous Chef"). */
  rankTitle: string;
};

/** Hub-facing content cards (recipes, challenges, tips). */
export type HubContentCard = {
  id: string;
  variant: "recipe" | "challenge" | "tip";
  title: string;
  body: string;
  ctaLabel: string;
  /** Optional XP badge shown on card. */
  xpReward?: number;
  icon: string;
};

export type HubUserSnapshot = {
  displayName: string;
  gamification: GamificationState;
  cards: HubContentCard[];
};
