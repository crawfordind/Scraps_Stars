"use client";

/**
 * CookExperience — integrates all three pillars in one flow.
 *
 * View modes:
 *  • hub    → GamifiedHub (gamification + content cards)
 *  • active → ActiveCookingView (utility only on screen)
 *
 * RewardBurst overlays either mode when gamification.pendingReward is set.
 */

import { useCallback, useEffect, useState } from "react";
import { useCookingSession } from "@/hooks/useCookingSession";
import { DEMO_HUB_SNAPSHOT, DEMO_UTILITY_STATE } from "@/lib/state/demoCookingData";
import type { HubContentCard } from "@/lib/state/cookingTypes";
import { ActiveCookingView } from "./active/ActiveCookingView";
import { GamifiedHub } from "./hub/GamifiedHub";
import { RewardBurst } from "./rewards/RewardBurst";

type ViewMode = "hub" | "active";

export function CookExperience() {
  const [mode, setMode] = useState<ViewMode>("hub");
  const [timerTick, setTimerTick] = useState(0);

  const session = useCookingSession({
    initialUtility: DEMO_UTILITY_STATE,
    initialGamification: DEMO_HUB_SNAPSHOT.gamification,
  });

  // Lightweight tick for timer display refresh (dock reads wall-clock)
  useEffect(() => {
    const id = window.setInterval(() => setTimerTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const enterActive = useCallback(() => setMode("active"), []);
  const exitActive = useCallback(() => setMode("hub"), []);

  const handleCardAction = useCallback(
    (card: HubContentCard) => {
      if (card.variant === "recipe" || card.variant === "challenge") {
        enterActive();
      }
    },
    [enterActive],
  );

  return (
    <div className="cook-experience">
      {mode === "hub" ? (
        <GamifiedHub
          snapshot={{
            ...DEMO_HUB_SNAPSHOT,
            gamification: session.gamification,
          }}
          onPrimaryAction={enterActive}
          primaryCtaLabel="Resume frittata"
          onCardAction={handleCardAction}
        />
      ) : (
        <>
          <button type="button" className="cook-experience__back" onClick={exitActive}>
            ← Hub
          </button>
          <ActiveCookingView
            utility={session.utility}
            onPrevStep={session.prevStep}
            onNextStep={session.nextStep}
            onCompleteStep={session.completeCurrentStep}
            onStartStepTimer={() => session.startStepTimer()}
            onPauseTimer={session.pauseTimer}
            onResumeTimer={session.resumeTimer}
            onDismissTimer={session.dismissTimer}
            timerTick={timerTick}
          />
        </>
      )}

      <RewardBurst
        event={session.gamification.pendingReward}
        onDismiss={session.clearPendingReward}
      />
    </div>
  );
}
