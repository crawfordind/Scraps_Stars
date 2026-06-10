import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { levelFromXp } from "@/lib/game/turns";

export const DEMO_USER_ID = "demo-user";

export async function ensureDemoUser() {
  const existing = await db.select().from(users).where(eq(users.id, DEMO_USER_ID)).get();
  if (existing) return existing;

  await db.insert(users).values({
    id: DEMO_USER_ID,
    name: "Fridge Challenger",
    selectedChefId: "bottura",
    createdAt: new Date(),
  });

  return db.select().from(users).where(eq(users.id, DEMO_USER_ID)).get();
}

export async function getUserProfile(userId: string = DEMO_USER_ID) {
  if (userId === DEMO_USER_ID) {
    return ensureDemoUser();
  }
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  return user ?? ensureDemoUser();
}

export async function setSelectedChef(userId: string, chefId: string) {
  await db.update(users).set({ selectedChefId: chefId }).where(eq(users.id, userId));
}

export async function awardXp(userId: string, amount: number) {
  const user = await getUserProfile(userId);
  if (!user) return null;

  const newXp = user.xp + amount;
  const newLevel = levelFromXp(newXp);

  await db.update(users).set({ xp: newXp, level: newLevel }).where(eq(users.id, userId));

  return { xp: newXp, level: newLevel, gained: amount, leveledUp: newLevel > user.level };
}
