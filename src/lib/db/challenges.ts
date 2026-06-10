import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { challengeEntries, challenges, savedRecipes, users } from "@/db/schema";
import type { Tier } from "@/lib/llm/types";

export type ChallengeConstraints = {
  maxTier?: Tier;
  theme?: string;
};

export type ChallengeRow = {
  id: string;
  theme: string;
  prompt: string;
  constraints: ChallengeConstraints;
  startsAt: Date;
  endsAt: Date;
  entryCount: number;
};

export const SHAME_SHELF_SUNDAY_ID = "shame-shelf-sunday";

export async function seedWeeklyChallenge() {
  const existing = await db.select().from(challenges).where(eq(challenges.id, SHAME_SHELF_SUNDAY_ID)).get();
  if (existing) return;

  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  await db.insert(challenges).values({
    id: SHAME_SHELF_SUNDAY_ID,
    theme: "Shame Shelf Sunday",
    prompt: "Cook something brilliant from the ingredients you're most embarrassed to still own.",
    constraints: JSON.stringify({ maxTier: 1, theme: "pantry-only" }),
    startsAt: start,
    endsAt: end,
  });
}

export async function getCurrentChallenge(): Promise<ChallengeRow | null> {
  await seedWeeklyChallenge();
  const now = new Date();
  const row = await db
    .select()
    .from(challenges)
    .where(and(lte(challenges.startsAt, now), gte(challenges.endsAt, now)))
    .orderBy(desc(challenges.startsAt))
    .get();

  if (!row) {
    const fallback = await db
      .select()
      .from(challenges)
      .orderBy(desc(challenges.startsAt))
      .get();
    if (!fallback) return null;
    return mapChallenge(fallback, await countEntries(fallback.id));
  }

  return mapChallenge(row, await countEntries(row.id));
}

async function countEntries(challengeId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeEntries)
    .where(eq(challengeEntries.challengeId, challengeId))
    .get();
  return result?.count ?? 0;
}

function mapChallenge(row: typeof challenges.$inferSelect, entryCount: number): ChallengeRow {
  return {
    id: row.id,
    theme: row.theme,
    prompt: row.prompt,
    constraints: JSON.parse(row.constraints) as ChallengeConstraints,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    entryCount,
  };
}

export async function getChallengeById(id: string): Promise<ChallengeRow | null> {
  const row = await db.select().from(challenges).where(eq(challenges.id, id)).get();
  if (!row) return null;
  return mapChallenge(row, await countEntries(row.id));
}

export async function enterChallenge(args: {
  userId: string;
  challengeId: string;
  recipeId: string;
  score: number;
}) {
  const existing = await db
    .select()
    .from(challengeEntries)
    .where(
      and(
        eq(challengeEntries.userId, args.userId),
        eq(challengeEntries.challengeId, args.challengeId),
      ),
    )
    .get();

  if (existing) {
    if (args.score > existing.score) {
      await db
        .update(challengeEntries)
        .set({ score: args.score, recipeId: args.recipeId, createdAt: new Date() })
        .where(eq(challengeEntries.id, existing.id));
    }
    return existing.id;
  }

  const id = nanoid();
  await db.insert(challengeEntries).values({
    id,
    userId: args.userId,
    challengeId: args.challengeId,
    recipeId: args.recipeId,
    score: args.score,
    createdAt: new Date(),
  });
  return id;
}

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  handle: string | null;
  avatarEmoji: string;
  score: number;
  recipeId: string;
  recipeName: string;
  shareId: string;
  platedPhotoUrl: string | null;
};

export async function getChallengeLeaderboard(challengeId: string, limit = 20): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select({
      userId: challengeEntries.userId,
      score: challengeEntries.score,
      recipeId: challengeEntries.recipeId,
      name: users.name,
      handle: users.handle,
      avatarEmoji: users.avatarEmoji,
      recipeName: savedRecipes.recipeName,
      shareId: savedRecipes.shareId,
      platedPhotoUrl: savedRecipes.platedPhotoUrl,
    })
    .from(challengeEntries)
    .innerJoin(users, eq(challengeEntries.userId, users.id))
    .innerJoin(savedRecipes, eq(challengeEntries.recipeId, savedRecipes.id))
    .where(eq(challengeEntries.challengeId, challengeId))
    .orderBy(desc(challengeEntries.score))
    .limit(limit);

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.userId,
    name: row.name ?? "Chef",
    handle: row.handle ?? null,
    avatarEmoji: row.avatarEmoji ?? "🍳",
    score: row.score,
    recipeId: row.recipeId,
    recipeName: row.recipeName,
    shareId: row.shareId,
    platedPhotoUrl: row.platedPhotoUrl,
  }));
}
