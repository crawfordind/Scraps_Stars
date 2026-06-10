import { NextResponse } from "next/server";
import { claimAnonymousIdentity, identitySchema, resolveIdentity, setAuthCookie } from "@/lib/identity/session";
import { ensureDemoUser } from "@/lib/db/user";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDemoUser();
    const identity = await resolveIdentity();
    return NextResponse.json({ ok: true, data: identity });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load identity" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureDemoUser();
    const json = await req.json();
    const input = identitySchema.parse(json);
    const { user, authToken } = await claimAnonymousIdentity(input);

    await setAuthCookie(authToken);

    return NextResponse.json({ ok: true, data: { user } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to claim identity" },
      { status: 400 },
    );
  }
}
