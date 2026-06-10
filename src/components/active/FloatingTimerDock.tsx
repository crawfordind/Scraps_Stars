"use client";

/**
 * FloatingTimerDock — modular async timer system (Pillar 2 utility).
 *
 * Kitchen ergonomics:
 *  • Fixed dock (z-50) stays visible while user scrolls recipe steps
 *  • Macro digits (clamp 2rem–3.5rem) readable from across the room
 *  • 56px min touch targets on pause / dismiss
 *  • High-contrast running vs complete states
 *
 * Timers are driven entirely by UtilityState — no gamification coupling.
 */

import { AnimatePresence, motion } from "framer-motion";
import { springSnappy } from "@/lib/motion/spring";
import { getTimerDisplaySeconds } from "@/hooks/useCookingSession";
import type { TimerInstance } from "@/lib/state/cookingTypes";

type FloatingTimerDockProps = {
  timers: TimerInstance[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDismiss: (id: string) => void;
};

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FloatingTimerDock({
  timers,
  onPause,
  onResume,
  onDismiss,
}: FloatingTimerDockProps) {
  const activeTimers = timers.filter((t) => t.status !== "idle");

  if (activeTimers.length === 0) return null;

  return (
    <div className="timer-dock" role="region" aria-label="Active timers">
      <AnimatePresence mode="popLayout">
        {activeTimers.map((timer) => {
          const seconds = getTimerDisplaySeconds(timer);
          const isComplete = timer.status === "complete";
          const isRunning = timer.status === "running";

          return (
            <motion.div
              key={timer.id}
              className={`timer-dock__chip ${isComplete ? "timer-dock__chip--complete" : ""} ${isRunning ? "timer-dock__chip--running" : ""}`}
              layout
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={springSnappy}
            >
              <div className="timer-dock__chip-inner">
                <span className="timer-dock__label">{timer.label}</span>
                <span
                  className="timer-dock__time"
                  aria-live={isRunning ? "polite" : "off"}
                  aria-atomic
                >
                  {isComplete ? "Done!" : formatMmSs(seconds)}
                </span>
              </div>

              <div className="timer-dock__actions">
                {!isComplete && (
                  <button
                    type="button"
                    className="timer-dock__btn"
                    onClick={() => (isRunning ? onPause(timer.id) : onResume(timer.id))}
                    aria-label={isRunning ? `Pause ${timer.label}` : `Resume ${timer.label}`}
                  >
                    {isRunning ? "⏸" : "▶"}
                  </button>
                )}
                <button
                  type="button"
                  className="timer-dock__btn timer-dock__btn--dismiss"
                  onClick={() => onDismiss(timer.id)}
                  aria-label={`Dismiss ${timer.label}`}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
