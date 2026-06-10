import { ACTIVE_CHALLENGE_KEY } from "./constants";

export function getActiveChallengeId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CHALLENGE_KEY);
}

export function setActiveChallenge(challengeId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_CHALLENGE_KEY, challengeId);
}

export function clearActiveChallenge(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_CHALLENGE_KEY);
}

export function cookRecipePath(recipeId: string, challengeId?: string | null): string {
  const id = challengeId ?? getActiveChallengeId();
  const base = `/cook/${recipeId}`;
  return id ? `${base}?challenge=${encodeURIComponent(id)}` : base;
}

export function scanForChallengePath(challengeId: string): string {
  return `/?tab=cook&challenge=${encodeURIComponent(challengeId)}`;
}
