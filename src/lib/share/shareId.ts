import { nanoid } from "nanoid";

/** URL-safe share identifier (~16 chars). */
export function generateShareId(): string {
  return nanoid(12);
}

export function recipePermalink(shareId: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/r/${shareId}`;
}

export function shareCardUrl(shareId: string, format: "story" | "link" = "story", origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const path = `/api/share-card/${shareId}`;
  return format === "link" ? `${base}${path}?format=link` : `${base}${path}`;
}

export const DEFAULT_SHARE_CAPTION = "Another feast from nothing. ";
