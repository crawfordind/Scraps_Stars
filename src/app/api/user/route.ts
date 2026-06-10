import { NextResponse } from "next/server";
import { z } from "zod";
import { awardXp, ensureDemoUser, getUserProfile, setSelectedChef } from "@/lib/db/user";
import { resolveUserIdFromRequest } from "@/lib/identity/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDemoUser();
    const userId = await resolveUserIdFromRequest();
    const user = await getUserProfile(userId);
    return NextResponse.json({
      ok: true,
      data: {
        id: user?.id,
        name: user?.name,
        xp: user?.xp ?? 0,
        level: user?.level ?? 1,
        streakDays: user?.streakDays ?? 0,
        selectedChefId: user?.selectedChefId ?? "bottura",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load user" },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  selectedChefId: z.string().optional(),
  awardXp: z.number().int().nonnegative().optional(),
});

export async function PATCH(req: Request) {
  try {
    await ensureDemoUser();
    const userId = await resolveUserIdFromRequest();
    const json = await req.json();
    const input = patchSchema.parse(json);

    if (input.selectedChefId) {
      await setSelectedChef(userId, input.selectedChefId);
    }

    let xpResult = null;
    if (input.awardXp && input.awardXp > 0) {
      xpResult = await awardXp(userId, input.awardXp);
    }

    const user = await getUserProfile(userId);
    return NextResponse.json({
      ok: true,
      data: {
        id: user?.id,
        name: user?.name,
        xp: user?.xp ?? 0,
        level: user?.level ?? 1,
        streakDays: user?.streakDays ?? 0,
        selectedChefId: user?.selectedChefId ?? "bottura",
        xpResult,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update user" },
      { status: 400 },
    );
  }
}
