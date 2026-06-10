import { NextResponse } from "next/server";
import { z } from "zod";
import { completeCookSession, upsertCookSession } from "@/lib/db/cookSessions";
import { resolveUserIdFromRequest } from "@/lib/identity/session";
import type { TimerInstance } from "@/lib/state/cookingTypes";

export const runtime = "nodejs";

const patchSchema = z.object({
  recipeId: z.string(),
  stepIndex: z.number().int().nonnegative(),
  completedSteps: z.array(z.number().int().nonnegative()),
  timers: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      durationSeconds: z.number(),
      startedAt: z.number().nullable(),
      remainingSeconds: z.number(),
      status: z.enum(["idle", "running", "paused", "complete"]),
      stepId: z.string().optional(),
    }),
  ),
  status: z.enum(["active", "completed", "abandoned"]).optional(),
  verdict: z.enum(["nailed", "tweak"]).optional(),
});

export async function GET(req: Request) {
  try {
    const userId = await resolveUserIdFromRequest();
    const recipeId = new URL(req.url).searchParams.get("recipeId");
    if (!recipeId) {
      return NextResponse.json({ ok: false, error: "recipeId required" }, { status: 400 });
    }
    const { getActiveCookSession } = await import("@/lib/db/cookSessions");
    const session = await getActiveCookSession(userId, recipeId);
    return NextResponse.json({ ok: true, data: session });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load session" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await resolveUserIdFromRequest();
    const json = await req.json();
    const input = patchSchema.parse(json);

    const session = await upsertCookSession({
      userId,
      recipeId: input.recipeId,
      stepIndex: input.stepIndex,
      completedSteps: input.completedSteps,
      timers: input.timers as TimerInstance[],
      status: input.status,
      verdict: input.verdict,
    });

    if (input.status === "completed" && input.verdict) {
      await completeCookSession(session.id, input.verdict);
    }

    return NextResponse.json({ ok: true, data: session });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save session" },
      { status: 400 },
    );
  }
}
