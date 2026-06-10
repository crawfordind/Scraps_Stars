import { NextResponse } from "next/server";
import { z } from "zod";
import { assembleCoachSnapshot, refreshCoachBriefing } from "@/lib/coach/refresh";
import type { CoachTrigger } from "@/lib/coach/types";
import { computeImpact, globalWasteContext } from "@/lib/impact/calculator";
import { getSavedRecipes } from "@/lib/db/recipes";
import { ensureDemoUser, getUserProfile } from "@/lib/db/user";
import { resolveUserIdFromRequest } from "@/lib/identity/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDemoUser();
    const userId = await resolveUserIdFromRequest();
    const [user, snapshot, recipes] = await Promise.all([
      getUserProfile(userId),
      assembleCoachSnapshot(userId),
      getSavedRecipes(userId),
    ]);

    const impact = computeImpact(
      recipes.map((r) => ({
        recipeName: r.recipeName,
        recipe: r.recipe,
        chefId: r.chefId,
        tier: r.tier,
        inventorySnapshot: r.inventorySnapshot,
        createdAt: r.createdAt,
      })),
      { xp: user?.xp ?? 0, level: user?.level ?? 1 },
    );

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          name: user?.name,
          level: user?.level,
          xp: user?.xp,
          selectedChefId: user?.selectedChefId,
        },
        coach: snapshot,
        impact,
        global: globalWasteContext(impact.foodRescuedKg),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load coach" },
      { status: 500 },
    );
  }
}

const refreshSchema = z.object({
  trigger: z.enum(["recipe_saved", "stale_refresh", "level_up", "welcome"]),
});

export async function POST(req: Request) {
  try {
    await ensureDemoUser();
    const userId = await resolveUserIdFromRequest();
    const json = await req.json();
    const input = refreshSchema.parse(json);

    const result = await refreshCoachBriefing(userId, input.trigger as CoachTrigger);

    return NextResponse.json({
      ok: true,
      data: {
        coach: result.snapshot,
        usedLlm: result.usedLlm,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to refresh coach" },
      { status: 400 },
    );
  }
}
