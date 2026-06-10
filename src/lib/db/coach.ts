import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userCoachContext } from "@/db/schema";
import type { CoachBriefing, CoachTrigger, PantryProfile } from "@/lib/coach/types";

const STALE_MS = 48 * 60 * 60 * 1000;

export function isCoachStale(generatedAt: Date): boolean {
  return Date.now() - generatedAt.getTime() > STALE_MS;
}

export async function getCoachContext(userId: string) {
  return db.select().from(userCoachContext).where(eq(userCoachContext.userId, userId)).get();
}

export async function saveCoachContext(args: {
  userId: string;
  briefing: CoachBriefing;
  pantryProfile: PantryProfile;
  foodSecurityScore: number;
  triggerEvent: CoachTrigger;
}) {
  const now = new Date();
  await db
    .insert(userCoachContext)
    .values({
      userId: args.userId,
      briefingJson: JSON.stringify(args.briefing),
      pantryProfileJson: JSON.stringify(args.pantryProfile),
      foodSecurityScore: args.foodSecurityScore,
      generatedAt: now,
      triggerEvent: args.triggerEvent,
    })
    .onConflictDoUpdate({
      target: userCoachContext.userId,
      set: {
        briefingJson: JSON.stringify(args.briefing),
        pantryProfileJson: JSON.stringify(args.pantryProfile),
        foodSecurityScore: args.foodSecurityScore,
        generatedAt: now,
        triggerEvent: args.triggerEvent,
      },
    });
  return now;
}

export function parseCoachContext(row: NonNullable<Awaited<ReturnType<typeof getCoachContext>>>) {
  return {
    briefing: JSON.parse(row.briefingJson) as CoachBriefing,
    pantryProfile: row.pantryProfileJson
      ? (JSON.parse(row.pantryProfileJson) as PantryProfile)
      : null,
    foodSecurityScore: row.foodSecurityScore,
    generatedAt: row.generatedAt,
    triggerEvent: row.triggerEvent as CoachTrigger,
  };
}
