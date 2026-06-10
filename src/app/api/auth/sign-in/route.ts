import { NextResponse } from "next/server";
import { setAuthCookie, signInNameSchema, signInWithName } from "@/lib/identity/session";
import { ensureDemoUser } from "@/lib/db/user";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await ensureDemoUser();
    const json = await req.json();
    const input = signInNameSchema.parse(json);
    const { session, authToken } = await signInWithName(input);

    await setAuthCookie(authToken);

    return NextResponse.json({ ok: true, data: { session } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Sign-in failed" },
      { status: 400 },
    );
  }
}
