import { NextResponse } from "next/server";
import { z } from "zod";
import { getSavedRecipeSummaries } from "@/lib/db/recipes";
import { ensureDemoUser } from "@/lib/db/user";
import { resolveUserIdFromRequest } from "@/lib/identity/session";
import { buildRecommendations } from "@/lib/recommendations/engine";

export const runtime = "nodejs";

const requestSchema = z.object({
  inventoryList: z.array(z.string()).default([]),
  currentChefId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await ensureDemoUser();
    const userId = await resolveUserIdFromRequest();
    const json = await req.json();
    const input = requestSchema.parse(json);

    const savedRecipes = await getSavedRecipeSummaries(userId);
    const recommendations = buildRecommendations({
      currentInventory: input.inventoryList,
      savedRecipes,
      currentChefId: input.currentChefId,
    });

    return NextResponse.json({ ok: true, data: recommendations });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to build recommendations" },
      { status: 400 },
    );
  }
}
