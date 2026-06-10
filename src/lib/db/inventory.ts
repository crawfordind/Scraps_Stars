import { eq } from "drizzle-orm";
import { db } from "@/db";
import { inventory } from "@/db/schema";
import { DEMO_USER_ID } from "@/lib/db/user";

export async function replaceUserInventory(
  userId: string,
  items: Array<{ ingredientName: string; quantity?: string; isSpice: boolean }>,
) {
  await db.delete(inventory).where(eq(inventory.userId, userId));

  if (items.length === 0) return;

  const now = new Date();
  await db.insert(inventory).values(
    items.map((item, index) => ({
      id: `${userId}-${Date.now()}-${index}`,
      userId,
      ingredientName: item.ingredientName,
      quantity: item.quantity ?? null,
      isSpice: item.isSpice,
      updatedAt: now,
    })),
  );
}

export async function getUserInventoryNames(userId: string): Promise<string[]> {
  const rows = await db
    .select({ ingredientName: inventory.ingredientName })
    .from(inventory)
    .where(eq(inventory.userId, userId));

  return rows.map((row) => row.ingredientName);
}
