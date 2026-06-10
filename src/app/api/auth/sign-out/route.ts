import { NextResponse } from "next/server";
import { signOutSession } from "@/lib/identity/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    await signOutSession();
    return NextResponse.json({ ok: true, data: { signedOut: true } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Sign-out failed" },
      { status: 500 },
    );
  }
}
