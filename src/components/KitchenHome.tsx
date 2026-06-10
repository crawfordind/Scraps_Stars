"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CoachSnapshot } from "@/lib/coach/types";
import type { ImpactStats } from "@/lib/impact/calculator";
import {
  fetchCoachHome,
  peekCoachHome,
  refreshCoachBriefing,
} from "@/lib/api/fetchers";
import { FoodSecurityMeter } from "./FoodSecurityMeter";
import { buildTipShare } from "@/lib/share/shareContent";
import { ShareButton } from "./ShareButton";
import { StoreDealsSection } from "./StoreDealsSection";
import { HomeSkeleton } from "./Skeleton";
import { FadeIn, MotionLink, SpringButton } from "@/components/motion/ui";

type ChallengePreview = {
  id: string;
  theme: string;
  prompt: string;
  entryCount: number;
} | null;

type KitchenHomeProps = {
  onPlay: () => void;
  onKitchen: () => void;
  refreshSignal?: number;
};

type HomeData = {
  user: { name: string; level: number; xp: number; selectedChefId: string };
  coach: CoachSnapshot;
  impact: ImpactStats;
};

export function KitchenHome({ onPlay, onKitchen, refreshSignal = 0 }: KitchenHomeProps) {
  const [data, setData] = useState<HomeData | null>(() => peekCoachHome());
  const [challenge, setChallenge] = useState<ChallengePreview>(null);
  const [failed, setFailed] = useState(false);
  const hadCache = useRef(!!peekCoachHome());

  const load = useCallback(async (force = false) => {
    const loaded = await fetchCoachHome(force);
    setData(loaded);
    setFailed(false);
    return loaded;
  }, []);

  useEffect(() => {
    void fetch("/api/challenges/current")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setChallenge(json.data);
      })
      .catch(() => undefined);
  }, [refreshSignal]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await load(refreshSignal > 0);
        if (cancelled) return;
        if (loaded.coach.isStale) {
          void refreshCoachBriefing("stale_refresh").then((coach) => {
            if (coach && !cancelled) {
              setData((prev) => (prev ? { ...prev, coach } : prev));
            }
          });
        }
      } catch {
        if (!cancelled && !hadCache.current) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [load, refreshSignal]);

  if (!data && !failed) {
    return <HomeSkeleton />;
  }

  if (!data) {
    return (
      <section className="panel">
        <p className="error" role="alert">Couldn&apos;t load your kitchen.</p>
        <button type="button" className="primary-btn" onClick={() => void load(true)}>
          Retry
        </button>
      </section>
    );
  }

  const { coach, impact } = data;
  const { briefing } = coach;

  return (
    <div className="kitchen-home">
      <FadeIn>
      <section className="home-hero">
        <div className="home-hero__top">
          <FoodSecurityMeter score={coach.foodSecurityScore} label={briefing.score_label} />
          <div className="home-hero__copy">
            <p className="home-hero__eyebrow">your resourceful host</p>
            <h2>{briefing.greeting}</h2>
            <p>{briefing.personalized_hook}</p>
          </div>
        </div>

        <SpringButton type="button" className="home-cta" onClick={onPlay}>
          <span className="home-cta__label">{briefing.next_best_action}</span>
          <span className="home-cta__arrow" aria-hidden>→</span>
        </SpringButton>
      </section>
      </FadeIn>

      <FadeIn delay={0.05}>
      <div className="home-quick-stats home-quick-stats--glance">
        <article className="home-stat">
          <span className="home-stat__value">{impact.mealsSaved}</span>
          <span className="home-stat__label">Meals secured</span>
        </article>
        <article className="home-stat">
          <span className="home-stat__value">{impact.foodRescuedKg} kg</span>
          <span className="home-stat__label">Food rescued</span>
        </article>
      </div>
      </FadeIn>

      {coach.pantryProfile.staples.length > 0 && (
        <FadeIn delay={0.08}>
        <section className="panel home-staples">
          <h3>Your staples</h3>
          <ul className="home-staples__list">
            {coach.pantryProfile.staples.map((item, index) => (
              <li key={`staple-${index}-${item}`}>{item}</li>
            ))}
          </ul>
        </section>
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
      <StoreDealsSection pantryProfile={coach.pantryProfile} />
      </FadeIn>

      <FadeIn delay={0.12}>
      <section className="panel home-cards">
        <article className="home-card home-card--security">
          <span className="home-card__icon" aria-hidden>🛡️</span>
          <div className="home-card__body">
            <div className="home-card__header">
              <h3>Food security tip</h3>
              <ShareButton
                content={buildTipShare(briefing.food_security_tip, coach.foodSecurityScore)}
                compact
              />
            </div>
            <p>{briefing.food_security_tip}</p>
          </div>
        </article>
        <article className="home-card home-card--fun">
          <span className="home-card__icon" aria-hidden>✨</span>
          <div className="home-card__body">
            <h3>{challenge?.theme ?? "Pantry Challenge"}</h3>
            <p>{challenge?.prompt ?? briefing.fun_challenge}</p>
            {challenge && (
              <p className="home-card__proof">
                {challenge.entryCount} cooks in this week&apos;s challenge
              </p>
            )}
            {challenge && (
              <MotionLink href={`/challenge/${challenge.id}`} className="secondary-btn home-card__join">
                Join challenge
              </MotionLink>
            )}
          </div>
        </article>
      </section>
      </FadeIn>

      <SpringButton type="button" className="secondary-btn home-secondary-cta" onClick={onKitchen}>
        See the table — wins &amp; saved feasts
      </SpringButton>
    </div>
  );
}
