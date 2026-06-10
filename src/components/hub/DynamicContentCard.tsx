"use client";

/**
 * DynamicContentCard — hub content tile with spatial depth.
 *
 * Design decisions (2026 aesthetic):
 *  • Layered z-index + translateY on hover simulates lifting a physical card
 *  • Colored ambient shadow (--card-glow) ties variant to gamification reward type
 *  • backdrop-filter on inner panel creates glass-over-parchment depth
 *  • Spring hover via Framer Motion (not CSS transition linear)
 */

import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion/spring";
import type { HubContentCard } from "@/lib/state/cookingTypes";

type DynamicContentCardProps = {
  card: HubContentCard;
  index: number;
  onAction: (card: HubContentCard) => void;
};

const VARIANT_GLOW: Record<HubContentCard["variant"], string> = {
  recipe: "var(--glow-accent)",
  challenge: "var(--glow-gold)",
  tip: "var(--glow-ember)",
};

export function DynamicContentCard({ card, index, onAction }: DynamicContentCardProps) {
  return (
    <motion.article
      className={`hub-card hub-card--${card.variant}`}
      style={{ "--card-glow": VARIANT_GLOW[card.variant] } as React.CSSProperties}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSnappy, delay: index * 0.06 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Decorative depth layer — sits behind content, never receives pointer events */}
      <span className="hub-card__ambient" aria-hidden />

      <div className="hub-card__inner">
        <span className="hub-card__icon" aria-hidden>
          {card.icon}
        </span>

        <div className="hub-card__body">
          <header className="hub-card__header">
            <h3>{card.title}</h3>
            {card.xpReward != null && (
              <span className="hub-card__xp">+{card.xpReward} XP</span>
            )}
          </header>
          <p>{card.body}</p>
        </div>
      </div>

      <motion.button
        type="button"
        className="hub-card__cta"
        onClick={() => onAction(card)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={springSnappy}
      >
        {card.ctaLabel}
        <span className="hub-card__cta-arrow" aria-hidden>
          →
        </span>
      </motion.button>
    </motion.article>
  );
}
