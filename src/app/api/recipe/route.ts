import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateRecipe,
  reviseRecipe,
  streamRecipe,
  type RecipeGenerationInput,
} from "@/lib/llm/openrouter";
import { recipeSchema, tierSchema } from "@/lib/llm/types";

export const runtime = "nodejs";

const generateSchema = z.object({
  mode: z.literal("generate").optional(),
  inventoryList: z.array(z.string()).min(1),
  preferences: z.array(z.string()).default([]),
  tier: tierSchema,
  chefId: z.string().optional(),
  flavorHints: z.array(z.string()).optional(),
  // When true, respond with a text/event-stream that reveals the recipe as it
  // generates (with a server-side fallback to the blocking path on failure).
  stream: z.boolean().optional(),
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

    const generationInput = {
      inventoryList: input.inventoryList,
      preferences: input.preferences,
      tier: input.tier,
      chefId: input.chefId,
      flavorHints: input.flavorHints,
    };

    if (input.stream) {
      return streamRecipeResponse(generationInput);
    }

    const result = await generateRecipe(generationInput);

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

/**
 * Server-Sent Events response that streams the recipe as it generates.
 * Emits `{type:"partial"}` snapshots, then a final `{type:"complete"}` with the
 * validated recipe + meta. If streaming fails, it falls back to the blocking
 * generator so the client still receives a complete recipe; only a total
 * failure emits `{type:"error"}`.
 */
function streamRecipeResponse(generationInput: RecipeGenerationInput): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const result = await streamRecipe(generationInput, {
          onPartial: (partial) => send({ type: "partial", data: partial }),
        });
        send({ type: "complete", data: result.data, meta: result.meta });
      } catch {
        // Streaming failed — fall back to the blocking generator so the user
        // still gets a recipe (no partials, but a correct final result).
        try {
          const result = await generateRecipe(generationInput);
          send({ type: "complete", data: result.data, meta: result.meta });
        } catch (fallbackError) {
          send({
            type: "error",
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : "Recipe generation failed",
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
