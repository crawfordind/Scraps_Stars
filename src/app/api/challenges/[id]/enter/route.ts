import { NextResponse } from "next/server";
import { z } from "zod";
import { enterChallenge, getChallengeById } from "@/lib/db/challenges";
import { getSavedRecipeById } from "@/lib/db/recipes";
import { getCoachContext } from "@/lib/db/coach";
import { resolveIdentity } from "@/lib/identity/session";
import { challengeEntryScoreSchema, computeChallengeEntryScore } from "@/lib/scoring/challengeScore";

export const runtime = "nodejs";

const bodySchema = z.object({
  recipeId: z.string(),
  nailedIt: z.boolean().default(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: challengeId } = await params;
    const identity = await resolveIdentity();
    if (!identity) {
      return NextResponse.json(
        { ok: false, error: "Sign in to enter the challenge" },
        { status: 401 },
      );
    }

    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json({ ok: false, error: "Challenge not found" }, { status: 404 });
    }

    const json = await req.json();
    const input = bodySchema.parse(json);
    const recipe = await getSavedRecipeById(input.recipeId);
    if (!recipe) {
      return NextResponse.json({ ok: false, error: "Recipe not found" }, { status: 404 });
    }

    if (challenge.constraints.maxTier && recipe.tier > challenge.constraints.maxTier) {
      return NextResponse.json(
        { ok: false, error: `This challenge requires Tier ${challenge.constraints.maxTier} or lower` },
        { status: 400 },
      );
    }

    const coach = await getCoachContext(identity.id);
    const foodSecurityScore = coach?.foodSecurityScore ?? 50;

    const scored = computeChallengeEntryScore({
      recipe: recipe.recipe,
      tier: recipe.tier,
      nailedIt: input.nailedIt,
      foodSecurityScore,
    });

    challengeEntryScoreSchema.parse(scored);

    const entryId = await enterChallenge({
      userId: identity.id,
      challengeId,
      recipeId: input.recipeId,
      score: scored.score,
    });

    return NextResponse.json({ ok: true, data: { entryId, ...scored } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to enter challenge" },
      { status: 400 },
    );
  }
}
