"use client";

import { useCallback, useEffect, useState } from "react";
import { getChefById } from "@/lib/chefs/personas";
import { cookRecipePath } from "@/lib/challenge/activeChallenge";
import { fetchDashboard, peekDashboard, type DashboardData } from "@/lib/api/fetchers";
import { buildInsightShare, buildRecordShare } from "@/lib/share/shareContent";
import { ChefAvatar } from "./ChefAvatar";
import { ShareButton } from "./ShareButton";
import { RecordSkeleton } from "./Skeleton";
import { FadeIn, MotionLink } from "@/components/motion/ui";

type ImpactDashboardProps = {
  onPlay: () => void;
  refreshSignal?: number;
};

export function ImpactDashboard({ onPlay, refreshSignal = 0 }: ImpactDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(() => peekDashboard());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setError(null);
    try {
      const loaded = await fetchDashboard(force);
      setData(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }, []);

  useEffect(() => {
    void load(refreshSignal > 0);
  }, [load, refreshSignal]);

  if (!data && !error) {
    return <RecordSkeleton />;
  }

  if (error || !data) {
    return (
      <section className="panel">
        <p className="error" role="alert">{error ?? "Something went wrong"}</p>
        <button type="button" className="primary-btn" onClick={() => void load(true)}>
          Try again
        </button>
      </section>
    );
  }

  const { stats, global, insights, recipes } = data;
  const favoriteChef = stats.favoriteChefId ? getChefById(stats.favoriteChefId) : null;

  return (
    <div className="impact-dashboard">
      <FadeIn>
      <section className="impact-hero">
        <div className="impact-hero__copy">
          <h2>What you&apos;ve brought to the table</h2>
          <p>
            Every saved feast is food rescued, money kept, and a little heroic. Track how your wins add up.
          </p>
        </div>
        <ShareButton
          content={buildRecordShare(stats, global)}
          className="impact-hero__share"
        />
      </section>

      <div className="impact-stats">
        <article className="impact-stat impact-stat--highlight">
          <span className="impact-stat__value">{stats.foodRescuedKg} kg</span>
          <span className="impact-stat__label">Food rescued</span>
        </article>
        <article className="impact-stat">
          <span className="impact-stat__value">{stats.mealsSaved}</span>
          <span className="impact-stat__label">Meals saved</span>
        </article>
        <article className="impact-stat">
          <span className="impact-stat__value">${stats.moneySavedUsd}</span>
          <span className="impact-stat__label">Est. savings</span>
        </article>
        <article className="impact-stat">
          <span className="impact-stat__value">Lv {stats.level}</span>
          <span className="impact-stat__label">{stats.xpEarned} XP</span>
        </article>
      </div>

      <section className="panel impact-global">
        <h3>The bigger picture</h3>
        <p className="impact-global__fact">
          ~{global.householdWastePercent}% of food worldwide never gets eaten — about{" "}
          {(global.globalAnnualWasteTons / 1_000_000_000).toFixed(1)} billion tonnes wasted every year.
        </p>
        <div className="impact-global__bar" role="img" aria-label={`You've offset ${global.weeklyShopPercent}% of a weekly shop`}>
          <div className="impact-global__fill" style={{ width: `${Math.max(4, global.weeklyShopPercent)}%` }} />
        </div>
        <p className="impact-global__you">
          You&apos;ve rescued <strong>{stats.ingredientsRescued} ingredients</strong> across{" "}
          <strong>{stats.pantryItemsUsed} pantry uses</strong> — keeping{" "}
          <strong>{stats.co2SavedKg} kg CO₂</strong> and{" "}
          <strong>{stats.waterSavedLiters.toLocaleString()} L water</strong> from going to waste.
        </p>
      </section>

      <section className="panel">
        <h3>Personalized insights</h3>
        <ul className="insight-list">
          {insights.map((insight) => (
            <li key={insight.headline} className="insight-card">
              <strong>{insight.headline}</strong>
              <p>{insight.detail}</p>
              <div className="insight-card__footer">
                <span className="insight-card__action">{insight.action}</span>
                <ShareButton content={buildInsightShare(insight)} compact />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Saved recipes</h3>
          <span className="impact-stat__label">{recipes.length} total</span>
        </div>

        {recipes.length === 0 ? (
          <div className="impact-empty">
            <p>Looks bare? Perfect. Play a round, love a dish, and tap <strong>Save this feast</strong>.</p>
            <button type="button" className="secondary-btn" onClick={onPlay}>
              Open the fridge, let&apos;s work with it
            </button>
          </div>
        ) : (
          <ul className="saved-gallery">
            {recipes.map((item) => {
              const chef = getChefById(item.chefId);
              return (
                <li key={item.id} className="saved-gallery__card">
                  {chef ? (
                    <ChefAvatar chef={chef} size="md" className="saved-gallery__photo" />
                  ) : (
                    <div className="saved-gallery__photo saved-gallery__photo--fallback" aria-hidden>🍽️</div>
                  )}
                  <div className="saved-gallery__body">
                    <strong>{item.recipeName}</strong>
                    <p>
                      {chef?.name ?? "Chef"} · Tier {item.tier} · {item.timeMinutes} min · {item.pantryCount} pantry items
                    </p>
                    <MotionLink href={cookRecipePath(item.id)} className="saved-gallery__cook">
                      Cook this
                    </MotionLink>
                  </div>
                  <span className="saved-gallery__xp">+{item.xpReward} XP</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </FadeIn>

      {favoriteChef && (
        <FadeIn delay={0.08}>
        <section className="panel ledger-chef">
          <ChefAvatar chef={favoriteChef} size="lg" className="ledger-chef__photo" />
          <div>
            <h3>Favorite coach</h3>
            <p className="ledger-chef__name">{favoriteChef.name}</p>
            <p className="ledger-chef__philosophy">{favoriteChef.wastePhilosophy}</p>
          </div>
        </section>
        </FadeIn>
      )}
    </div>
  );
}
