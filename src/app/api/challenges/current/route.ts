import { NextResponse } from "next/server";
import { getCurrentChallenge } from "@/lib/db/challenges";
import { ensureDemoUser } from "@/lib/db/user";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDemoUser();
    const challenge = await getCurrentChallenge();
    return NextResponse.json({ ok: true, data: challenge });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load challenge" },
      { status: 500 },
    );
  }
}
