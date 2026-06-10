import { NextResponse } from "next/server";
import { getChallengeById, getChallengeLeaderboard } from "@/lib/db/challenges";
import { ensureDemoUser } from "@/lib/db/user";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDemoUser();
    const { id } = await params;
    const challenge = await getChallengeById(id);
    if (!challenge) {
      return NextResponse.json({ ok: false, error: "Challenge not found" }, { status: 404 });
    }
    const leaderboard = await getChallengeLeaderboard(id);
    return NextResponse.json({ ok: true, data: { challenge, leaderboard } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load leaderboard" },
      { status: 500 },
    );
  }
}
