"use client";

/**
 * LiveCookExperience — real cook mode wired to saved recipes + session persistence.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { RecipeOutput, Tier } from "@/lib/llm/types";
import { getActiveChallengeId } from "@/lib/challenge/activeChallenge";
import { normalizeIngredients, normalizeRecipeToSteps } from "@/lib/cook/normalizeSteps";
import { useCookingSession } from "@/hooks/useCookingSession";
import { xpProgressInLevel } from "@/lib/game/turns";
import type { TimerInstance } from "@/lib/state/cookingTypes";
import { ActiveCookingView } from "./active/ActiveCookingView";
import { RewardBurst } from "./rewards/RewardBurst";
import { VerdictPanel } from "./cook/VerdictPanel";
import { PrescriptionShareButton } from "./PrescriptionShareButton";
import { compressImageFile } from "@/lib/images/compressClient";
import { FadeIn, MotionLink, SpringButton } from "@/components/motion/ui";

type RecipeRow = {
  id: string;
  shareId: string;
  recipe: RecipeOutput;
  chefId: string;
  tier: Tier;
  platedPhotoUrl: string | null;
};

type LiveCookExperienceProps = {
  recipeRow: RecipeRow;
  initialXp: number;
  initialLevel: number;
  challengeId?: string;
};

type CookPhase = "cooking" | "verdict" | "complete";

type ChallengeEntryResult = {
  ok: boolean;
  error?: string;
  score?: number;
  challengeId?: string;
};

async function persistSession(args: {
  recipeId: string;
  stepIndex: number;
  completedSteps: number[];
  timers: TimerInstance[];
  status?: "active" | "completed" | "abandoned";
  verdict?: "nailed" | "tweak";
}) {
  await fetch("/api/cook/session", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export function LiveCookExperience({
  recipeRow,
  initialXp,
  initialLevel,
  challengeId,
}: LiveCookExperienceProps) {
  const [phase, setPhase] = useState<CookPhase>("cooking");
  const [timerTick, setTimerTick] = useState(0);
  const [currentRecipe, setCurrentRecipe] = useState<RecipeOutput>(recipeRow.recipe);
  const [shareId] = useState(recipeRow.shareId);
  const [platedPhotoUrl, setPlatedPhotoUrl] = useState<string | null>(recipeRow.platedPhotoUrl);
  const [reviseLoading, setReviseLoading] = useState(false);
  const [bonusXp, setBonusXp] = useState(0);
  const [resolvedChallengeId, setResolvedChallengeId] = useState<string | null>(challengeId ?? null);
  const [challengeEntry, setChallengeEntry] = useState<ChallengeEntryResult | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const completedStepsRef = useRef<number[]>([]);

  useEffect(() => {
    setResolvedChallengeId(challengeId ?? getActiveChallengeId());
  }, [challengeId]);

  const utilityInitial = {
    recipeId: recipeRow.id,
    recipeTitle: currentRecipe.recipe_name,
    steps: normalizeRecipeToSteps(currentRecipe, recipeRow.id),
    currentStepIndex: 0,
    timers: [] as TimerInstance[],
    ingredients: normalizeIngredients(currentRecipe, recipeRow.id),
  };

  const session = useCookingSession({
    initialUtility: utilityInitial,
    initialGamification: {
      xp: initialXp,
      level: initialLevel,
      levelProgress: xpProgressInLevel(initialXp).current / xpProgressInLevel(initialXp).needed,
      rankTitle: "Pantry Apprentice",
    },
  });

  // Only tick the timer display while a timer is actually running. The previous
  // unconditional 500ms interval re-rendered the entire (motion-heavy) cooking
  // tree twice a second forever — even with no active timer — which is the main
  // source of cook-mode jank / unresponsiveness. Idle stepping now costs nothing.
  const hasRunningTimer = session.utility.timers.some((t) => t.status === "running");
  useEffect(() => {
    if (!hasRunningTimer) return;
    const id = window.setInterval(() => setTimerTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, [hasRunningTimer]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/cook/session?recipeId=${encodeURIComponent(recipeRow.id)}`);
      const json = await res.json();
      if (cancelled || !json.ok || !json.data) return;
      const saved = json.data as {
        stepIndex: number;
        completedSteps: number[];
        timers: TimerInstance[];
      };
      completedStepsRef.current = saved.completedSteps;
      session.goToStep(saved.stepIndex);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeRow.id]);

  useEffect(() => {
    if (phase !== "cooking") return;
    const sync = () => {
      void persistSession({
        recipeId: recipeRow.id,
        stepIndex: session.utility.currentStepIndex,
        completedSteps: completedStepsRef.current,
        timers: session.utility.timers,
        status: "active",
      });
    };
    const id = window.setInterval(sync, 4000);
    return () => window.clearInterval(id);
  }, [phase, recipeRow.id, session.utility]);

  useEffect(() => {
    if (phase !== "cooking") return;
    let cancelled = false;
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator && !cancelled) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* unsupported or denied */
      }
    };
    void acquire();
    return () => {
      cancelled = true;
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [phase]);

  const submitChallengeEntry = useCallback(async (targetChallengeId: string) => {
    const res = await fetch(`/api/challenges/${targetChallengeId}/enter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: recipeRow.id, nailedIt: true }),
    });
    const json = await res.json();
    const result: ChallengeEntryResult = {
      ok: json.ok === true,
      error: json.ok ? undefined : (json.error as string | undefined),
      score: json.data?.score as number | undefined,
      challengeId: targetChallengeId,
    };
    setChallengeEntry(result);
    return result;
  }, [recipeRow.id]);

  const handleCompleteStep = useCallback(() => {
    const idx = session.utility.currentStepIndex;
    if (!completedStepsRef.current.includes(idx)) {
      completedStepsRef.current = [...completedStepsRef.current, idx];
    }
    const isLast = idx >= session.utility.steps.length - 1;
    if (isLast) {
      setPhase("verdict");
      void persistSession({
        recipeId: recipeRow.id,
        stepIndex: idx,
        completedSteps: completedStepsRef.current,
        timers: session.utility.timers,
        status: "active",
      });
      return;
    }
    session.completeCurrentStep();
  }, [recipeRow.id, session]);

  const awardBonusXp = useCallback(async (amount: number) => {
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awardXp: amount }),
    });
    const json = await res.json();
    if (json.ok) {
      setBonusXp(amount);
      session.addXp(amount);
    }
  }, [session]);

  const handleNailedIt = useCallback(
    async (photoFile?: File) => {
      let photoUrl: string | null = platedPhotoUrl;
      if (photoFile) {
        const compressed = await compressImageFile(photoFile);
        const form = new FormData();
        form.append("file", compressed);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
        const uploadJson = await uploadRes.json();
        if (uploadJson.ok) photoUrl = uploadJson.data.imageUrl as string;
      }

      await fetch(`/api/recipes/${recipeRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platedPhotoUrl: photoUrl, nailedIt: true }),
      });

      setPlatedPhotoUrl(photoUrl);
      await awardBonusXp(25);
      session.queueReward({
        kind: "recipe",
        title: "Nailed It!",
        subtitle: currentRecipe.recipe_name,
        xpGained: 25,
        accent: "gold",
      });

      await persistSession({
        recipeId: recipeRow.id,
        stepIndex: session.utility.currentStepIndex,
        completedSteps: completedStepsRef.current,
        timers: session.utility.timers,
        status: "completed",
        verdict: "nailed",
      });

      const targetChallenge = resolvedChallengeId ?? getActiveChallengeId();
      if (targetChallenge) {
        await submitChallengeEntry(targetChallenge);
      }

      setPhase("complete");
    },
    [
      awardBonusXp,
      currentRecipe.recipe_name,
      platedPhotoUrl,
      recipeRow.id,
      resolvedChallengeId,
      session,
      submitChallengeEntry,
    ],
  );

  const handleTweakIt = useCallback(
    async (gripe: string) => {
      setReviseLoading(true);
      try {
        const res = await fetch("/api/recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "revise",
            originalRecipe: currentRecipe,
            gripe,
            chefId: recipeRow.chefId,
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? "Revise failed");

        const revised = json.data as RecipeOutput;
        setCurrentRecipe(revised);
        await fetch(`/api/recipes/${recipeRow.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe: revised, nailedIt: false }),
        });

        await persistSession({
          recipeId: recipeRow.id,
          stepIndex: 0,
          completedSteps: [],
          timers: [],
          status: "active",
          verdict: "tweak",
        });

        completedStepsRef.current = [];
        session.goToStep(0);
        setPhase("cooking");
        window.location.reload();
      } finally {
        setReviseLoading(false);
      }
    },
    [currentRecipe, recipeRow.chefId, recipeRow.id, session],
  );

  return (
    <div className="cook-experience">
      <MotionLink href="/" className="cook-experience__back">
        ← Home
      </MotionLink>

      {resolvedChallengeId && phase !== "complete" && (
        <FadeIn className="challenge-cook-banner panel">
          <p>
            Cooking for this week&apos;s challenge — finish with <strong>Nailed It</strong> to land on the
            leaderboard.
          </p>
        </FadeIn>
      )}

      {phase === "cooking" && (
        <ActiveCookingView
          utility={{
            ...session.utility,
            recipeTitle: currentRecipe.recipe_name,
            steps: normalizeRecipeToSteps(currentRecipe, recipeRow.id),
          }}
          onPrevStep={session.prevStep}
          onNextStep={session.nextStep}
          onCompleteStep={handleCompleteStep}
          onStartStepTimer={() => session.startStepTimer()}
          onPauseTimer={session.pauseTimer}
          onResumeTimer={session.resumeTimer}
          onDismissTimer={session.dismissTimer}
          timerTick={timerTick}
        />
      )}

      {phase === "verdict" && (
        <VerdictPanel
          recipeName={currentRecipe.recipe_name}
          onNailedIt={handleNailedIt}
          onTweakIt={handleTweakIt}
          loading={reviseLoading}
        />
      )}

      {phase === "complete" && (
        <FadeIn className="panel verdict-complete">
          <h2>Told you. Feast.</h2>
          <p>
            {platedPhotoUrl
              ? "Your plated photo is on the share card. Spread the word — another feast from nothing."
              : "Spread the word — another feast from nothing."}
          </p>
          {platedPhotoUrl && (
            <div className="verdict-complete__photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={platedPhotoUrl} alt={`Plated ${currentRecipe.recipe_name}`} />
            </div>
          )}
          {bonusXp > 0 && <p className="verdict-complete__xp">+{bonusXp} bonus XP (est.)</p>}

          {challengeEntry && (
            <div className={`verdict-complete__challenge ${challengeEntry.ok ? "verdict-complete__challenge--ok" : "verdict-complete__challenge--warn"}`}>
              {challengeEntry.ok ? (
                <p>
                  You&apos;re on the leaderboard — <strong>{challengeEntry.score} pts</strong> (est.)
                </p>
              ) : (
                <p>
                  Couldn&apos;t add to the challenge: {challengeEntry.error ?? "Unknown error"}.{" "}
                  {challengeEntry.error?.toLowerCase().includes("sign in") && challengeEntry.challengeId && (
                    <Link href={`/?tab=home&challenge=${challengeEntry.challengeId}`}>Sign in</Link>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="verdict-actions">
            <PrescriptionShareButton shareId={shareId} label="Share recipe card" />
            {challengeEntry?.ok && challengeEntry.challengeId && (
              <MotionLink href={`/challenge/${challengeEntry.challengeId}`} className="secondary-btn">
                View leaderboard
              </MotionLink>
            )}
            <MotionLink href={`/r/${shareId}`} className="secondary-btn">
              View recipe link
            </MotionLink>
          </div>
        </FadeIn>
      )}

      <RewardBurst event={session.gamification.pendingReward} onDismiss={session.clearPendingReward} />
    </div>
  );
}
