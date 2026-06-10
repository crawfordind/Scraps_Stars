import { NextResponse } from "next/server";
import { z } from "zod";
import { generateRecipe, reviseRecipe } from "@/lib/llm/openrouter";
import { recipeSchema, tierSchema } from "@/lib/llm/types";

export const runtime = "nodejs";

const generateSchema = z.object({
  mode: z.literal("generate").optional(),
  inventoryList: z.array(z.string()).min(1),
  preferences: z.array(z.string()).default([]),
  tier: tierSchema,
  chefId: z.string().optional(),
  flavorHints: z.array(z.string()).optional(),
});

const reviseSchema = z.object({
  mode: z.literal("revise"),
  originalRecipe: recipeSchema,
  gripe: z.string().min(3).max(500),
  chefId: z.string().optional(),
});

const requestSchema = z.union([generateSchema, reviseSchema]);

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = requestSchema.parse(json);

    if (input.mode === "revise") {
      const result = await reviseRecipe({
        originalRecipe: input.originalRecipe,
        gripe: input.gripe,
        chefId: input.chefId,
      });
      return NextResponse.json({ ok: true, data: result.data, meta: result.meta });
    }

    const result = await generateRecipe({
      inventoryList: input.inventoryList,
      preferences: input.preferences,
      tier: input.tier,
      chefId: input.chefId,
      flavorHints: input.flavorHints,
    });

    return NextResponse.json({ ok: true, data: result.data, meta: result.meta });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown recipe generation error",
      },
      { status: 400 },
    );
  }
}
