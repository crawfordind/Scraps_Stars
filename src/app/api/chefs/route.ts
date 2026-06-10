import { NextResponse } from "next/server";
import { CHEF_PERSONAS } from "@/lib/chefs/personas";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: CHEF_PERSONAS.map(({ promptFragment: _p, portraitPrompt: _pp, ...chef }) => chef),
  });
}
