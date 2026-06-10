"use client";

/**
 * ProgressionHero — celebrates current gamification status on the hub.
 *
 * Spatial depth stack (back → front):
 *   z-0  ambient gradient orb (blurred, gold/accent bleed)
 *   z-1  frosted glass panel (backdrop-filter)
 *   z-2  XP ring + rank title (typographic hierarchy)
 *   z-3  streak flame + level badge (micro-accents)
 */

import { motion } from "framer-motion";
import { springCelebration, springGentle } from "@/lib/motion/spring";
import type { GamificationState } from "@/lib/state/cookingTypes";

type ProgressionHeroProps = {
  displayName: string;
  gamification: GamificationState;
};

export function ProgressionHero({ displayName, gamification }: ProgressionHeroProps) {
  const { level, levelProgress, streak, rankTitle, xp } = gamification;
  const ringCircumference = 2 * Math.PI * 42;
  const dashOffset = ringCircumference * (1 - levelProgress);

  return (
    <motion.section
      className="hub-hero"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springCelebration}
    >
      {/* Ambient depth orb — colored shadow source */}
      <div className="hub-hero__orb" aria-hidden />

      <div className="hub-hero__glass">
        <div className="hub-hero__top">
          {/* Progress ring: SVG stroke animates with spring-mapped dashoffset */}
          <motion.div
            className="hub-hero__ring-wrap"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springCelebration}
          >
            <svg className="hub-hero__ring" viewBox="0 0 100 100" aria-hidden>
              <circle className="hub-hero__ring-track" cx="50" cy="50" r="42" />
              <motion.circle
                className="hub-hero__ring-fill"
                cx="50"
                cy="50"
                r="42"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={springGentle}
              />
            </svg>
            <div className="hub-hero__ring-center">
              <span className="hub-hero__level">{level}</span>
              <span className="hub-hero__level-label">Level</span>
            </div>
          </motion.div>

          <div className="hub-hero__copy">
            <p className="hub-hero__eyebrow">Welcome back</p>
            <h2 className="hub-hero__name">{displayName}</h2>
            <p className="hub-hero__rank">{rankTitle}</p>
            <p className="hub-hero__xp-total">{xp.toLocaleString()} XP earned</p>
          </div>
        </div>

        {/* Streak chip — high-contrast, large tap target for kitchen glanceability */}
        <motion.div
          className="hub-hero__streak"
          whileHover={{ scale: 1.03 }}
          transition={springCelebration}
        >
          <span className="hub-hero__streak-flame" aria-hidden>
            🔥
          </span>
          <span>
            <strong>{streak}-day streak</strong>
            <small>Keep cooking to level up faster</small>
          </span>
        </motion.div>
      </div>
    </motion.section>
  );
}
