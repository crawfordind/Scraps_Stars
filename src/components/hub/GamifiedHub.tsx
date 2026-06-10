"use client";

/**
 * GamifiedHub — Pillar 1: the user's home dashboard.
 *
 * Layout zones:
 *  1. ProgressionHero — celebrates rank, level, streak (gamification read)
 *  2. Primary CTA rail — single dominant action into core loop (scan / cook)
 *  3. DynamicContentCard grid — recipes, challenges, tips (placeholder-ready)
 *  4. Quick stats strip — impact metrics at a glance
 *
 * State: reads HubUserSnapshot (gamification + content cards only).
 * No timer or step logic lives here — keeps hub lightweight.
 */

import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion/spring";
import type { HubContentCard, HubUserSnapshot } from "@/lib/state/cookingTypes";
import { DynamicContentCard } from "./DynamicContentCard";
import { ProgressionHero } from "./ProgressionHero";

type GamifiedHubProps = {
  snapshot: HubUserSnapshot;
  /** Primary loop entry — e.g. "Scan My Kitchen" or "Resume Cooking". */
  onPrimaryAction: () => void;
  primaryCtaLabel?: string;
  onCardAction?: (card: HubContentCard) => void;
};

export function GamifiedHub({
  snapshot,
  onPrimaryAction,
  primaryCtaLabel = "Start cooking",
  onCardAction,
}: GamifiedHubProps) {
  const handleCard = (card: HubContentCard) => {
    onCardAction?.(card);
  };

  return (
    <div className="gamified-hub">
      <ProgressionHero displayName={snapshot.displayName} gamification={snapshot.gamification} />

      {/* Primary CTA — largest tap target, accent glow shadow for spatial pop */}
      <motion.button
        type="button"
        className="hub-primary-cta"
        onClick={onPrimaryAction}
        whileHover={{ y: -2, boxShadow: "var(--shadow-cta-hover)" }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={springSnappy}
      >
        <span className="hub-primary-cta__glow" aria-hidden />
        <span className="hub-primary-cta__label">{primaryCtaLabel}</span>
        <span className="hub-primary-cta__arrow" aria-hidden>
          →
        </span>
      </motion.button>

      {/* Dynamic content — cards stagger in for perceived performance */}
      <section className="hub-cards-section" aria-labelledby="hub-cards-heading">
        <h3 id="hub-cards-heading" className="hub-section-title">
          For you today
        </h3>
        <div className="hub-cards-grid">
          {snapshot.cards.map((card, i) => (
            <DynamicContentCard key={card.id} card={card} index={i} onAction={handleCard} />
          ))}
        </div>
      </section>

      {/* Secondary stats — reinforces gamification without competing with CTA */}
      <div className="hub-stats-strip">
        <article className="hub-stat-pill">
          <span className="hub-stat-pill__value">{snapshot.gamification.badges.length}</span>
          <span className="hub-stat-pill__label">Badges</span>
        </article>
        <article className="hub-stat-pill hub-stat-pill--highlight">
          <span className="hub-stat-pill__value">Lv {snapshot.gamification.level}</span>
          <span className="hub-stat-pill__label">Chef rank</span>
        </article>
        <article className="hub-stat-pill">
          <span className="hub-stat-pill__value">{snapshot.gamification.streak}d</span>
          <span className="hub-stat-pill__label">Streak</span>
        </article>
      </div>
    </div>
  );
}
