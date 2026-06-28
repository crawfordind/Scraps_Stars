"use client";

/**
 * ActiveCookingView — Pillar 2: utility screen for hands-on cooking.
 *
 * Legibility-first layout:
 *  • Full-bleed high-contrast stage (dark ink on warm parchment inverse)
 *  • Step headline at clamp(2rem, 8vw, 3.25rem) — readable from 3+ feet
 *  • Giant prev/next zones (min 64px) for low-touch / messy-hands use
 *  • Optional voice-hint region (aria-live) for screen reader parity
 *
 * FloatingTimerDock overlays independently — timers survive step navigation.
 */

import { AnimatePresence, motion } from "framer-motion";
import { springSnappy } from "@/lib/motion/spring";
import type { UtilityState } from "@/lib/state/cookingTypes";
import { FloatingTimerDock } from "./FloatingTimerDock";

type ActiveCookingViewProps = {
  utility: UtilityState;
  onPrevStep: () => void;
  onNextStep: () => void;
  onCompleteStep: () => void;
  onStartStepTimer: () => void;
  onPauseTimer: (id: string) => void;
  onResumeTimer: (id: string) => void;
  onDismissTimer: (id: string) => void;
  /** Bump to refresh timer display seconds. */
  timerTick?: number;
};

export function ActiveCookingView({
  utility,
  onPrevStep,
  onNextStep,
  onCompleteStep,
  onStartStepTimer,
  onPauseTimer,
  onResumeTimer,
  onDismissTimer,
  timerTick,
}: ActiveCookingViewProps) {
  const { steps, currentStepIndex, recipeTitle, timers } = utility;
  const step = steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;
  const hasTimer = (step?.timerSeconds ?? 0) > 0;

  return (
    <div className="active-cook" data-timer-tick={timerTick}>
      {/* Recipe context — subdued so step headline dominates visual hierarchy */}
      <header className="active-cook__header">
        <p className="active-cook__recipe">{recipeTitle}</p>
        <p className="active-cook__progress" aria-live="polite">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
        <p className="active-cook__announce sr-only" aria-live="assertive">
          {step?.headline}
        </p>
      </header>

      {/* Step stage — slide-only transition (NO opacity keyframe).
          The step headline is the entire point of cook mode, so it must never be
          hidden. A velocity-driven spring on opacity can stall near 0 under load
          and leave the instruction invisible; animating only `x` keeps the text
          at full opacity always, with a deterministic time-based tween. */}
      <main className="active-cook__stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={step?.id ?? "empty"}
            className="active-cook__step"
            initial={{ x: 40 }}
            animate={{ x: 0 }}
            exit={{ x: -40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h1 className="active-cook__headline">{step?.headline}</h1>
            {step?.detail && <p className="active-cook__detail">{step.detail}</p>}
          </motion.div>
        </AnimatePresence>

        {/* Step dots — large hit areas for jumping between steps */}
        <nav className="active-cook__dots" aria-label="Recipe steps">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={`active-cook__dot ${i === currentStepIndex ? "active-cook__dot--current" : ""} ${i < currentStepIndex ? "active-cook__dot--done" : ""}`}
              aria-current={i === currentStepIndex ? "step" : undefined}
            />
          ))}
        </nav>
      </main>

      {/* Action rail — oversized buttons, spring feedback on press */}
      <footer className="active-cook__rail">
        <motion.button
          type="button"
          className="active-cook__nav-btn"
          onClick={onPrevStep}
          disabled={isFirst}
          whileTap={{ scale: 0.94 }}
          transition={springSnappy}
          aria-label="Previous step"
        >
          ← Back
        </motion.button>

        {hasTimer && (
          <motion.button
            type="button"
            className="active-cook__timer-btn"
            onClick={onStartStepTimer}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
          >
            ⏱ {step?.timerLabel ?? "Start timer"}
          </motion.button>
        )}

        <motion.button
          type="button"
          className="active-cook__complete-btn"
          onClick={onCompleteStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={springSnappy}
        >
          {isLast ? "Finish recipe ✓" : "Done · next step ✓"}
        </motion.button>

        {/* Secondary: jump ahead WITHOUT marking the step done (no XP). Labeled
            "Skip" so it reads distinctly from the primary complete-and-advance
            action rather than as a second, competing "forward" button. */}
        <motion.button
          type="button"
          className="active-cook__nav-btn"
          onClick={onNextStep}
          disabled={isLast}
          whileTap={{ scale: 0.94 }}
          transition={springSnappy}
          aria-label="Skip to next step without marking done"
        >
          Skip →
        </motion.button>
      </footer>

      {/* Async timer dock — z-50, independent of step scroll */}
      <FloatingTimerDock
        timers={timers}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onDismiss={onDismissTimer}
      />
    </div>
  );
}
