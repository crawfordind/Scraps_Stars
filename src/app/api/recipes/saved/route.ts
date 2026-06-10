import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteSavedRecipe, getSavedRecipes, saveRecipe } from "@/lib/db/recipes";
import { ensureDemoUser } from "@/lib/db/user";
import { resolveUserIdFromRequest } from "@/lib/identity/session";
import { recipeSchema, tierSchema } from "@/lib/llm/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDemoUser();
    const userId = await resolveUserIdFromRequest();
    const recipes = await getSavedRecipes(userId);
    return NextResponse.json({ ok: true, data: recipes });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load recipes" },
      { status: 500 },
    );
  }
}

const saveSchema = z.object({
  recipe: recipeSchema,
  chefId: z.string(),
  tier: tierSchema,
  inventorySnapshot: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    await ensureDemoUser();
    const userId = await resolveUserIdFromRequest();
    const json = await req.json();
    const input = saveSchema.parse(json);

    const { id, shareId } = await saveRecipe({
      userId,
      recipe: input.recipe,
      chefId: input.chefId,
      tier: input.tier,
      inventorySnapshot: input.inventorySnapshot,
    });

    return NextResponse.json({ ok: true, data: { id, shareId } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save recipe" },
      { status: 400 },
    );
  }
}

const deleteSchema = z.object({
  id: z.string(),
});

export async function DELETE(req: Request) {
  try {
    const userId = await resolveUserIdFromRequest();
    const json = await req.json();
    const input = deleteSchema.parse(json);
    await deleteSavedRecipe(userId, input.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to delete recipe" },
      { status: 400 },
    );
  }
}
