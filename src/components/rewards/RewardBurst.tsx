"use client";

/**
 * RewardBurst — Pillar 3: dopamine feedback on significant actions.
 *
 * Animation stack (Framer Motion + spring physics):
 *  1. Backdrop blur dims utility layer (focus on reward)
 *  2. Central badge scales in with celebration spring (overshoot)
 *  3. Particle burst radiates with staggered opacity
 *  4. XP counter ticks up with gentle spring
 *  5. Auto-dismiss or tap-to-dismiss with snappy exit
 *
 * Triggered by gamification.pendingReward — never blocks utility state.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { springCelebration, springSnappy } from "@/lib/motion/spring";
import type { RewardEvent } from "@/lib/state/cookingTypes";

type RewardBurstProps = {
  event: RewardEvent | null;
  onDismiss: () => void;
  /** Auto-close after ms (0 = manual only). */
  autoDismissMs?: number;
};

const KIND_ICON: Record<RewardEvent["kind"], string> = {
  step: "✓",
  recipe: "⭐",
  level: "⬆",
  streak: "🔥",
  challenge: "🏆",
};

/** Deterministic particle offsets from reward id (stable across re-renders). */
function particlesFromId(id: string, count = 12): Array<{ x: number; y: number; delay: number }> {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i);
  return Array.from({ length: count }, (_, i) => {
    const angle = ((seed + i * 47) % 360) * (Math.PI / 180);
    const dist = 60 + ((seed + i * 13) % 80);
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      delay: i * 0.03,
    };
  });
}

export function RewardBurst({ event, onDismiss, autoDismissMs = 2800 }: RewardBurstProps) {
  useEffect(() => {
    if (!event || autoDismissMs <= 0) return;
    const t = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(t);
  }, [event, autoDismissMs, onDismiss]);

  const particles = event ? particlesFromId(event.id) : [];

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className={`reward-burst reward-burst--${event.accent}`}
          role="alertdialog"
          aria-labelledby="reward-title"
          aria-describedby="reward-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onDismiss}
        >
          {/* Frosted backdrop — spatial separation from active cook view */}
          <motion.div
            className="reward-burst__backdrop"
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(12px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
          />

          <motion.div
            className="reward-burst__card"
            initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={springCelebration}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Particle burst — colored ambient shadows per accent */}
            <div className="reward-burst__particles" aria-hidden>
              {particles.map((p, i) => (
                <motion.span
                  key={i}
                  className="reward-burst__particle"
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], x: p.x, y: p.y, scale: [0, 1.2, 0.6] }}
                  transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
                />
              ))}
            </div>

            <motion.span
              className="reward-burst__icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springCelebration, delay: 0.1 }}
              aria-hidden
            >
              {KIND_ICON[event.kind]}
            </motion.span>

            <h2 id="reward-title" className="reward-burst__title">
              {event.title}
            </h2>
            {event.subtitle && (
              <p id="reward-subtitle" className="reward-burst__subtitle">
                {event.subtitle}
              </p>
            )}

            <motion.p
              className="reward-burst__xp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSnappy, delay: 0.25 }}
            >
              +{event.xpGained} XP
            </motion.p>

            <button type="button" className="reward-burst__dismiss" onClick={onDismiss}>
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
