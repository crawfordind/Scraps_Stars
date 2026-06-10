import { NextResponse } from "next/server";
import { resolveAuthSession } from "@/lib/identity/session";
import { ensureDemoUser } from "@/lib/db/user";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDemoUser();
    const session = await resolveAuthSession();
    return NextResponse.json({ ok: true, data: { session } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load session" },
      { status: 500 },
    );
  }
}
