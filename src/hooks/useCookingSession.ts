"use client";

/**
 * useCookingSession — orchestrates Utility vs Gamification state.
 *
 * Architecture:
 *  • utility* actions mutate only UtilityState (steps, timers, ingredients)
 *  • gamification* actions mutate only GamificationState (XP, rewards)
 *  • completing a step touches BOTH: advance step + queue reward
 *
 * Timers tick via requestAnimationFrame-style interval so they stay accurate
 * while the user scrolls through steps (decoupled from step index).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { levelFromXp, xpProgressInLevel } from "@/lib/game/turns";
import type {
  GamificationState,
  RewardEvent,
  TimerInstance,
  UtilityState,
} from "@/lib/state/cookingTypes";

export type CookingSessionState = {
  utility: UtilityState;
  gamification: GamificationState;
};

type UseCookingSessionOptions = {
  initialUtility: UtilityState;
  initialGamification?: Partial<GamificationState>;
  onReward?: (event: RewardEvent) => void;
};

function buildGamification(partial?: Partial<GamificationState>): GamificationState {
  const xp = partial?.xp ?? 120;
  const level = partial?.level ?? levelFromXp(xp);
  const progress = xpProgressInLevel(xp);
  return {
    xp,
    level,
    streak: partial?.streak ?? 3,
    levelProgress: progress.current / progress.needed,
    badges: partial?.badges ?? [],
    pendingReward: partial?.pendingReward ?? null,
    rankTitle: partial?.rankTitle ?? "Pantry Apprentice",
  };
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useCookingSession({
  initialUtility,
  initialGamification,
  onReward,
}: UseCookingSessionOptions) {
  const [utility, setUtility] = useState<UtilityState>(initialUtility);
  const [gamification, setGamification] = useState<GamificationState>(() =>
    buildGamification(initialGamification),
  );

  const onRewardRef = useRef(onReward);
  onRewardRef.current = onReward;

  /** ── Utility actions ─────────────────────────────────────────── */

  const goToStep = useCallback((index: number) => {
    setUtility((u) => ({
      ...u,
      currentStepIndex: Math.max(0, Math.min(index, u.steps.length - 1)),
    }));
  }, []);

  const nextStep = useCallback(() => {
    setUtility((u) => ({
      ...u,
      currentStepIndex: Math.min(u.currentStepIndex + 1, u.steps.length - 1),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setUtility((u) => ({
      ...u,
      currentStepIndex: Math.max(u.currentStepIndex - 1, 0),
    }));
  }, []);

  const toggleIngredient = useCallback((id: string) => {
    setUtility((u) => ({
      ...u,
      ingredients: u.ingredients.map((ing) =>
        ing.id === id ? { ...ing, checked: !ing.checked } : ing,
      ),
    }));
  }, []);

  const startTimer = useCallback(
    (opts: { label: string; durationSeconds: number; stepId?: string }) => {
      const timer: TimerInstance = {
        id: uid(),
        label: opts.label,
        durationSeconds: opts.durationSeconds,
        startedAt: Date.now(),
        remainingSeconds: opts.durationSeconds,
        status: "running",
        stepId: opts.stepId,
      };
      setUtility((u) => ({ ...u, timers: [...u.timers, timer] }));
      return timer.id;
    },
    [],
  );

  const pauseTimer = useCallback((timerId: string) => {
    setUtility((u) => ({
      ...u,
      timers: u.timers.map((t) => {
        if (t.id !== timerId || t.status !== "running" || t.startedAt == null) return t;
        const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
        const remaining = Math.max(0, t.remainingSeconds - elapsed);
        return { ...t, status: "paused", startedAt: null, remainingSeconds: remaining };
      }),
    }));
  }, []);

  const resumeTimer = useCallback((timerId: string) => {
    setUtility((u) => ({
      ...u,
      timers: u.timers.map((t) =>
        t.id === timerId && t.status === "paused"
          ? { ...t, status: "running", startedAt: Date.now() }
          : t,
      ),
    }));
  }, []);

  const dismissTimer = useCallback((timerId: string) => {
    setUtility((u) => ({
      ...u,
      timers: u.timers.filter((t) => t.id !== timerId),
    }));
  }, []);

  /** Start timer from current step's suggested duration. */
  const startStepTimer = useCallback(() => {
    const step = utility.steps[utility.currentStepIndex];
    if (!step?.timerSeconds) return null;
    return startTimer({
      label: step.timerLabel ?? step.headline,
      durationSeconds: step.timerSeconds,
      stepId: step.id,
    });
  }, [utility.currentStepIndex, utility.steps, startTimer]);

  /** ── Gamification actions ────────────────────────────────────── */

  const queueReward = useCallback((event: Omit<RewardEvent, "id">) => {
    const full: RewardEvent = { ...event, id: uid() };
    setGamification((g) => ({ ...g, pendingReward: full }));
    onRewardRef.current?.(full);
    return full;
  }, []);

  const clearPendingReward = useCallback(() => {
    setGamification((g) => ({ ...g, pendingReward: null }));
  }, []);

  const addXp = useCallback((amount: number) => {
    setGamification((g) => {
      const newXp = g.xp + amount;
      const progress = xpProgressInLevel(newXp);
      return {
        ...g,
        xp: newXp,
        level: progress.level,
        levelProgress: progress.current / progress.needed,
      };
    });
  }, []);

  /** Complete current step: advance utility + grant XP + fire reward. */
  const completeCurrentStep = useCallback(() => {
    const step = utility.steps[utility.currentStepIndex];
    const isLast = utility.currentStepIndex >= utility.steps.length - 1;
    const xpGain = isLast ? 50 : 15;

    addXp(xpGain);
    queueReward({
      kind: isLast ? "recipe" : "step",
      title: isLast ? "Recipe complete!" : "Step nailed",
      subtitle: step?.headline,
      xpGained: xpGain,
      accent: isLast ? "gold" : "accent",
    });

    if (!isLast) {
      nextStep();
    }
  }, [utility, addXp, queueReward, nextStep]);

  /** ── Timer tick loop (utility only) ──────────────────────────── */

  useEffect(() => {
    const id = window.setInterval(() => {
      setUtility((u) => {
        let changed = false;
        const timers = u.timers.map((t) => {
          if (t.status !== "running" || t.startedAt == null) return t;
          const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
          const remaining = t.remainingSeconds - elapsed;
          if (remaining <= 0) {
            changed = true;
            return { ...t, status: "complete" as const, startedAt: null, remainingSeconds: 0 };
          }
          return t;
        });
        return changed ? { ...u, timers } : u;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  return {
    utility,
    gamification,
    goToStep,
    nextStep,
    prevStep,
    toggleIngredient,
    startTimer,
    startStepTimer,
    pauseTimer,
    resumeTimer,
    dismissTimer,
    completeCurrentStep,
    queueReward,
    clearPendingReward,
    addXp,
  };
}

/** Derive live remaining seconds for display. */
export function getTimerDisplaySeconds(timer: TimerInstance): number {
  if (timer.status === "complete") return 0;
  if (timer.status === "running" && timer.startedAt != null) {
    const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
    return Math.max(0, timer.remainingSeconds - elapsed);
  }
  return timer.remainingSeconds;
}
