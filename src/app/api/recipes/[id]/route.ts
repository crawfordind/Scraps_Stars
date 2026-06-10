import { NextResponse } from "next/server";
import { z } from "zod";
import { getSavedRecipeById, updateRecipeAfterVerdict } from "@/lib/db/recipes";
import { resolveUserIdFromRequest } from "@/lib/identity/session";
import { recipeSchema } from "@/lib/llm/types";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const recipe = await getSavedRecipeById(id);
    if (!recipe) {
      return NextResponse.json({ ok: false, error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: recipe });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load recipe" },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  recipe: recipeSchema.optional(),
  platedPhotoUrl: z.string().url().nullable().optional(),
  nailedIt: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await resolveUserIdFromRequest();
    const json = await req.json();
    const input = patchSchema.parse(json);
    await updateRecipeAfterVerdict({
      recipeId: id,
      recipe: input.recipe,
      platedPhotoUrl: input.platedPhotoUrl,
      nailedIt: input.nailedIt,
    });
    const updated = await getSavedRecipeById(id);
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update recipe" },
      { status: 400 },
    );
  }
}
