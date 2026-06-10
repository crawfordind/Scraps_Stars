"use client";

import { useCallback, useEffect, useState } from "react";
import { setActiveChallenge, scanForChallengePath } from "@/lib/challenge/activeChallenge";
import { formatCompetitorLabel } from "@/lib/identity/display";
import { PrescriptionShareButton } from "@/components/PrescriptionShareButton";
import { IdentityClaimForm } from "@/components/IdentityClaimForm";
import { ShareButton } from "@/components/ShareButton";
import { FadeIn, MotionLink } from "@/components/motion/ui";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  handle: string | null;
  avatarEmoji: string;
  score: number;
  recipeId: string;
  recipeName: string;
  shareId: string;
  platedPhotoUrl: string | null;
};

type ChallengeData = {
  challenge: {
    id: string;
    theme: string;
    prompt: string;
    entryCount: number;
    constraints: { maxTier?: number };
  };
  leaderboard: LeaderboardEntry[];
};

type IdentityState = {
  name: string;
  handle: string | null;
  avatarEmoji: string;
};

function leaderboardPrimary(entry: LeaderboardEntry): string {
  return entry.name.trim() || entry.handle || "Chef";
}

export function ChallengePageClient({ challengeId }: { challengeId: string }) {
  const [data, setData] = useState<ChallengeData | null>(null);
  const [identity, setIdentity] = useState<IdentityState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [lbRes, idRes] = await Promise.all([
      fetch(`/api/challenges/${challengeId}/leaderboard`),
      fetch("/api/identity"),
    ]);
    const lbJson = await lbRes.json();
    const idJson = await idRes.json();
    if (!lbJson.ok) throw new Error(lbJson.error ?? "Failed to load challenge");
    setData(lbJson.data);
    if (idJson.ok && idJson.data) {
      setIdentity({
        name: idJson.data.name,
        handle: idJson.data.handle ?? null,
        avatarEmoji: idJson.data.avatarEmoji ?? "🍳",
      });
    } else {
      setIdentity(null);
    }
  }, [challengeId]);

  useEffect(() => {
    setActiveChallenge(challengeId);
    void load().catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [load, challengeId]);

  if (error) {
    return (
      <main id="main-content" className="public-page">
        <p className="error" role="alert">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main id="main-content" className="public-page">
        <p>Loading challenge…</p>
      </main>
    );
  }

  const { challenge, leaderboard } = data;
  const topThree = leaderboard.slice(0, 3);

  return (
    <main id="main-content" className="public-page challenge-page">
      <FadeIn>
      <header className="challenge-page__hero">
        <p className="public-page__eyebrow">Shame Shelf Sunday</p>
        <h1>{challenge.theme}</h1>
        <p>{challenge.prompt}</p>
        <p className="challenge-page__proof">
          <strong>{challenge.entryCount}</strong> cooks in this week&apos;s challenge
        </p>
      </header>
      </FadeIn>

      {!identity ? (
        <section className="panel identity-claim">
          <h2>Sign in to join</h2>
          <p>
            Open the home page and tell us your name — then come back here to compete as yourself,
            not a demo handle.
          </p>
          <MotionLink href="/?tab=home" className="primary-btn">
            Go to sign in
          </MotionLink>
        </section>
      ) : (
        <>
          <p className="challenge-page__identity">
            {identity.avatarEmoji} {formatCompetitorLabel(identity.name, identity.handle)} — ready to
            compete
          </p>
          {!identity.handle && (
            <IdentityClaimForm
              displayName={identity.name}
              onClaimed={(user) => {
                setIdentity({
                  name: user.name,
                  handle: user.handle,
                  avatarEmoji: user.avatarEmoji,
                });
                void load();
              }}
            />
          )}
        </>
      )}

      {topThree.length > 0 && (
        <section className="panel challenge-page__featured">
          <h2>Featured recipe cards</h2>
          <ul className="challenge-featured">
            {topThree.map((entry) => (
              <li key={entry.userId} className="challenge-featured__card">
                <span className="challenge-featured__rank">#{entry.rank}</span>
                {entry.platedPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.platedPhotoUrl}
                    alt={`${entry.recipeName}, plated by ${leaderboardPrimary(entry)}`}
                    className="challenge-featured__photo"
                  />
                ) : (
                  <span className="challenge-featured__emoji">{entry.avatarEmoji}</span>
                )}
                <div>
                  <strong>{leaderboardPrimary(entry)}</strong>
                  {entry.handle && entry.handle !== entry.name && (
                    <p className="stamp-label">@{entry.handle}</p>
                  )}
                  <p>{entry.recipeName}</p>
                  <p>{entry.score} pts (est.)</p>
                </div>
                <PrescriptionShareButton shareId={entry.shareId} compact label="Recipe card" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <h2>Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p>Be the first on the board — cook a Tier {challenge.constraints.maxTier ?? 1} recipe and nail it.</p>
        ) : (
          <ol className="challenge-leaderboard">
            {leaderboard.map((entry) => (
              <li key={`${entry.userId}-${entry.rank}`} className="challenge-leaderboard__row">
                <span className="challenge-leaderboard__rank">{entry.rank}</span>
                <span className="challenge-leaderboard__avatar">{entry.avatarEmoji}</span>
                {entry.platedPhotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.platedPhotoUrl}
                    alt={`${entry.recipeName}, plated by ${leaderboardPrimary(entry)}`}
                    className="challenge-leaderboard__thumb"
                  />
                )}
                <div className="challenge-leaderboard__body">
                  <strong>{leaderboardPrimary(entry)}</strong>
                  {entry.handle && entry.handle !== entry.name && (
                    <span className="stamp-label">@{entry.handle}</span>
                  )}
                  <span>{entry.recipeName}</span>
                </div>
                <span className="challenge-leaderboard__score">{entry.score}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="public-page__cta-row">
        <MotionLink href={scanForChallengePath(challengeId)} className="primary-btn">
          Scan & cook
        </MotionLink>
        <ShareButton
          label="Share challenge"
          content={{
            title: challenge.theme,
            text: `${challenge.prompt}\n\nJoin this week's Pantry Challenge:`,
            url: typeof window !== "undefined" ? `${window.location.origin}/challenge/${challengeId}` : undefined,
          }}
        />
      </div>
    </main>
  );
}
