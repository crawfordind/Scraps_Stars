import { NextResponse } from "next/server";
import { getSavedRecipes } from "@/lib/db/recipes";
import { ensureDemoUser, getUserProfile } from "@/lib/db/user";
import { resolveUserIdFromRequest } from "@/lib/identity/session";
import { buildDashboardInsights, computeImpact, globalWasteContext } from "@/lib/impact/calculator";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDemoUser();
    const userId = await resolveUserIdFromRequest();
    const [user, recipes] = await Promise.all([
      getUserProfile(userId),
      getSavedRecipes(userId),
    ]);

    const stats = computeImpact(
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

    const global = globalWasteContext(stats.foodRescuedKg);
    const insights = buildDashboardInsights(stats);

    return NextResponse.json({
      ok: true,
      data: {
        stats,
        global,
        insights,
        recipes: recipes.map((r) => ({
          id: r.id,
          shareId: r.shareId,
          recipeName: r.recipeName,
          chefId: r.chefId,
          tier: r.tier,
          xpReward: r.recipe.xp_reward,
          timeMinutes: r.recipe.estimated_time_minutes,
          pantryCount: r.recipe.ingredients_pantry.length,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load dashboard" },
      { status: 500 },
    );
  }
}
