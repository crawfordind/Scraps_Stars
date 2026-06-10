import type { CoachSnapshot, CoachTrigger } from "@/lib/coach/types";
import type { ImpactStats } from "@/lib/impact/calculator";
import type { RecipeOutput, Tier } from "@/lib/llm/types";
import type { RecommendationResult } from "@/lib/recommendations/engine";
import { fetchWithCache, getCached, invalidateCache, setCached } from "./clientCache";

export type SavedRecipeItem = {
  id: string;
  shareId: string;
  recipeName: string;
  recipe: RecipeOutput;
  chefId: string;
  tier: Tier;
  inventorySnapshot: string[];
  createdAt: Date | string;
};

const TTL = {
  coach: 45_000,
  dashboard: 45_000,
  user: 30_000,
  savedRecipes: 45_000,
} as const;

const KEYS = {
  coach: "api:coach",
  dashboard: "api:dashboard",
  user: "api:user",
  savedRecipes: "api:recipes:saved",
} as const;

export type CoachHomeData = {
  user: { name: string; level: number; xp: number; selectedChefId: string };
  coach: CoachSnapshot;
  impact: ImpactStats;
};

export type UserData = {
  id?: string;
  name?: string;
  xp: number;
  level: number;
  streakDays: number;
  selectedChefId: string;
};

export type DashboardData = {
  stats: ImpactStats;
  global: {
    globalAnnualWasteTons: number;
    householdWastePercent: number;
    yourSharePercent: number;
    weeklyShopPercent: number;
  };
  insights: Array<{ headline: string; detail: string; action: string }>;
  recipes: Array<{
    id: string;
    shareId: string;
    recipeName: string;
    chefId: string;
    tier: number;
    xpReward: number;
    timeMinutes: number;
    pantryCount: number;
    createdAt: string;
  }>;
};

async function parseJson<T>(res: Response, fallbackError: string): Promise<T> {
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? fallbackError);
  return json.data as T;
}

export function peekCoachHome(): CoachHomeData | null {
  return getCached<CoachHomeData>(KEYS.coach);
}

export function peekDashboard(): DashboardData | null {
  return getCached<DashboardData>(KEYS.dashboard);
}

export function peekUser(): UserData | null {
  return getCached<UserData>(KEYS.user);
}

export function peekSavedRecipes(): SavedRecipeItem[] | null {
  return getCached<SavedRecipeItem[]>(KEYS.savedRecipes);
}

export function invalidateCoachHome(): void {
  invalidateCache(KEYS.coach);
}

export function invalidateDashboard(): void {
  invalidateCache(KEYS.dashboard);
}

export function invalidateUser(): void {
  invalidateCache(KEYS.user);
}

export function invalidateSavedRecipes(): void {
  invalidateCache(KEYS.savedRecipes);
}

export function invalidateAfterRecipeChange(): void {
  invalidateCoachHome();
  invalidateDashboard();
  invalidateSavedRecipes();
}

export function invalidateAfterUserChange(): void {
  invalidateUser();
  invalidateCoachHome();
  invalidateDashboard();
}

export function invalidateAfterAuthChange(): void {
  invalidateAfterUserChange();
  invalidateSavedRecipes();
}

export async function fetchCoachHome(force = false): Promise<CoachHomeData> {
  return fetchWithCache(
    KEYS.coach,
    () => fetch("/api/coach").then((r) => parseJson<CoachHomeData>(r, "Failed to load coach")),
    TTL.coach,
    { force },
  );
}

export async function fetchDashboard(force = false): Promise<DashboardData> {
  return fetchWithCache(
    KEYS.dashboard,
    () => fetch("/api/dashboard").then((r) => parseJson<DashboardData>(r, "Failed to load dashboard")),
    TTL.dashboard,
    { force },
  );
}

export async function fetchUser(force = false): Promise<UserData> {
  return fetchWithCache(
    KEYS.user,
    () => fetch("/api/user").then((r) => parseJson<UserData>(r, "Failed to load user")),
    TTL.user,
    { force },
  );
}

export async function fetchSavedRecipes(force = false): Promise<SavedRecipeItem[]> {
  return fetchWithCache(
    KEYS.savedRecipes,
    () => fetch("/api/recipes/saved").then((r) => parseJson<SavedRecipeItem[]>(r, "Failed to load recipes")),
    TTL.savedRecipes,
    { force },
  );
}

let coachRefreshInFlight: Promise<CoachSnapshot | null> | null = null;
let staleRefreshStarted = false;

export async function refreshCoachBriefing(
  trigger: CoachTrigger,
): Promise<CoachSnapshot | null> {
  if (trigger === "stale_refresh") {
    if (staleRefreshStarted) return coachRefreshInFlight;
    staleRefreshStarted = true;
  }

  if (coachRefreshInFlight) return coachRefreshInFlight;

  coachRefreshInFlight = fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger }),
  })
    .then((r) => r.json())
    .then((json) => {
      if (!json.ok) return null;
      const coach = json.data.coach as CoachSnapshot;
      const cached = getCached<CoachHomeData>(KEYS.coach);
      if (cached) {
        setCached(KEYS.coach, { ...cached, coach }, TTL.coach);
      }
      return coach;
    })
    .finally(() => {
      coachRefreshInFlight = null;
    });

  return coachRefreshInFlight;
}

export async function fetchRecommendations(
  inventory: string[],
  chefId: string,
): Promise<RecommendationResult> {
  const res = await fetch("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inventoryList: inventory, currentChefId: chefId }),
  });
  return parseJson<RecommendationResult>(res, "Failed to load recommendations");
}
