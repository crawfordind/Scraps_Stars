import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cookSessions } from "@/db/schema";
import type { TimerInstance } from "@/lib/state/cookingTypes";
import { nanoid } from "nanoid";

export type CookSessionRow = {
  id: string;
  recipeId: string;
  userId: string;
  stepIndex: number;
  completedSteps: number[];
  timers: TimerInstance[];
  startedAt: Date;
  status: "active" | "completed" | "abandoned";
  verdict: "nailed" | "tweak" | null;
};

function parseRow(row: typeof cookSessions.$inferSelect): CookSessionRow {
  return {
    id: row.id,
    recipeId: row.recipeId,
    userId: row.userId,
    stepIndex: row.stepIndex,
    completedSteps: JSON.parse(row.completedSteps) as number[],
    timers: JSON.parse(row.timers) as TimerInstance[],
    startedAt: row.startedAt,
    status: row.status as CookSessionRow["status"],
    verdict: (row.verdict as CookSessionRow["verdict"]) ?? null,
  };
}

export async function getActiveCookSession(userId: string, recipeId: string): Promise<CookSessionRow | null> {
  const row = await db
    .select()
    .from(cookSessions)
    .where(
      and(
        eq(cookSessions.userId, userId),
        eq(cookSessions.recipeId, recipeId),
        eq(cookSessions.status, "active"),
      ),
    )
    .get();

  return row ? parseRow(row) : null;
}

export async function getCookSessionById(sessionId: string): Promise<CookSessionRow | null> {
  const row = await db.select().from(cookSessions).where(eq(cookSessions.id, sessionId)).get();
  return row ? parseRow(row) : null;
}

export async function upsertCookSession(args: {
  userId: string;
  recipeId: string;
  stepIndex: number;
  completedSteps: number[];
  timers: TimerInstance[];
  status?: CookSessionRow["status"];
  verdict?: CookSessionRow["verdict"];
}): Promise<CookSessionRow> {
  const existing = await db
    .select()
    .from(cookSessions)
    .where(eq(cookSessions.userId, args.userId))
    .get();

  const payload = {
    stepIndex: args.stepIndex,
    completedSteps: JSON.stringify(args.completedSteps),
    timers: JSON.stringify(args.timers),
    status: args.status ?? "active",
    verdict: args.verdict ?? null,
  };

  if (existing && existing.recipeId === args.recipeId && existing.status === "active") {
    await db.update(cookSessions).set(payload).where(eq(cookSessions.id, existing.id));
    const updated = await db.select().from(cookSessions).where(eq(cookSessions.id, existing.id)).get();
    return parseRow(updated!);
  }

  const id = nanoid();
  await db.insert(cookSessions).values({
    id,
    recipeId: args.recipeId,
    userId: args.userId,
    ...payload,
    startedAt: new Date(),
  });

  const row = await db.select().from(cookSessions).where(eq(cookSessions.id, id)).get();
  return parseRow(row!);
}

export async function completeCookSession(sessionId: string, verdict: "nailed" | "tweak") {
  await db
    .update(cookSessions)
    .set({ status: "completed", verdict })
    .where(eq(cookSessions.id, sessionId));
}
