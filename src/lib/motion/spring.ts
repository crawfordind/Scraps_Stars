/**
 * Shared Framer Motion spring presets.
 *
 * 2026 aesthetic rule: avoid linear easing for state changes.
 * Springs feel tactile — slight overshoot reads as physical, not digital.
 */
import type { Transition } from "framer-motion";

/** Snappy UI feedback (buttons, chips, dock expand). */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
  mass: 0.8,
};

/** Hero entrances and reward bursts — more dramatic overshoot. */
export const springCelebration: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 18,
  mass: 1.1,
};

/** Subtle layout shifts (step transitions, card reorder). */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 26,
  mass: 1,
};
