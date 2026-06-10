import { NextResponse } from "next/server";
import { z } from "zod";
import { extractInventoryFromImage } from "@/lib/llm/openrouter";
import { ModelJsonParseError } from "@/lib/llm/normalize";
import { replaceUserInventory } from "@/lib/db/inventory";
import { ensureDemoUser } from "@/lib/db/user";
import { resolveUserIdFromRequest } from "@/lib/identity/session";

function friendlyExtractError(error: unknown): string {
  if (error instanceof ModelJsonParseError) return error.message;
  if (error instanceof z.ZodError) {
    return "The scan results were incomplete. Please try again with a clearer photo.";
  }
  if (error instanceof Error) return error.message;
  return "Unknown inventory extraction error";
}

export const runtime = "nodejs";

const requestSchema = z.object({
  imageUrl: z.string().url(),
  persist: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = requestSchema.parse(json);
    const result = await extractInventoryFromImage({ imageUrl: input.imageUrl });

    if (input.persist) {
      await ensureDemoUser();
      const userId = await resolveUserIdFromRequest();
      if (userId) {
        await replaceUserInventory(
          userId,
          result.data.ingredients.map((item) => ({
            ingredientName: item.ingredientName,
            quantity: item.quantity,
            isSpice: item.isSpice,
          })),
        );
      }
    }

    return NextResponse.json({ ok: true, data: result.data, meta: result.meta });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: friendlyExtractError(error),
      },
      { status: 400 },
    );
  }
}
