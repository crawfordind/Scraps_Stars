"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { setActiveChallenge, getActiveChallengeId } from "@/lib/challenge/activeChallenge";
import { invalidateAfterAuthChange, invalidateAfterRecipeChange } from "@/lib/api/fetchers";
import { TabContent } from "@/components/motion/ui";
import { useAuthSession } from "@/hooks/useAuthSession";
import { FridgeGame } from "./FridgeGame";
import { ImpactDashboard } from "./ImpactDashboard";
import { KitchenHome } from "./KitchenHome";
import { ProfileIndicator } from "./ProfileIndicator";
import { SignInPanel } from "./SignInPanel";

type Tab = "home" | "play" | "kitchen";

function tabFromQuery(value: string | null): Tab | null {
  if (value === "play" || value === "consult" || value === "scan" || value === "cook") return "play";
  if (value === "kitchen" || value === "record" || value === "table") return "kitchen";
  if (value === "home" || value === "larder") return "home";
  return null;
}

export function AppShell() {
  const searchParams = useSearchParams();
  const { session, needsSignIn, signOut, continueAsGuest, refresh } = useAuthSession();
  const [tab, setTab] = useState<Tab>(() => tabFromQuery(searchParams.get("tab")) ?? "home");
  const [gameKey, setGameKey] = useState(0);
  const [dataRefreshSignal, setDataRefreshSignal] = useState(0);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const goPlay = useCallback(() => {
    setTab("play");
    setGameKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("challenge");
    if (fromUrl) {
      setActiveChallenge(fromUrl);
      setActiveChallengeId(fromUrl);
    } else {
      setActiveChallengeId(getActiveChallengeId());
    }
  }, [searchParams]);

  useEffect(() => {
    const next = tabFromQuery(searchParams.get("tab"));
    if (next === "play") goPlay();
    else if (next === "kitchen") setTab("kitchen");
    else if (next === "home") setTab("home");
  }, [searchParams, goPlay]);

  const refreshData = useCallback(() => {
    invalidateAfterRecipeChange();
    setDataRefreshSignal((s) => s + 1);
  }, []);

  const handleSignedIn = useCallback(() => {
    void refresh();
    invalidateAfterAuthChange();
    setDataRefreshSignal((s) => s + 1);
  }, [refresh]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
      setDataRefreshSignal((s) => s + 1);
    } finally {
      setSigningOut(false);
    }
  }, [signOut]);

  return (
    <>
      {needsSignIn && (
        <SignInPanel
          onSignedIn={handleSignedIn}
          onGuest={continueAsGuest}
        />
      )}

      {session && (
        <ProfileIndicator
          session={session}
          onSignOut={handleSignOut}
          signingOut={signingOut}
        />
      )}

      <nav className="app-tabs" aria-label="Main navigation">
        <button
          type="button"
          className={`app-tabs__btn ${tab === "home" ? "app-tabs__btn--active" : ""}`}
          onClick={() => setTab("home")}
        >
          <span className="app-tabs__label">Larder</span>
          <span className="app-tabs__sub">Home</span>
        </button>
        <button
          type="button"
          className={`app-tabs__btn ${tab === "play" ? "app-tabs__btn--active" : ""}`}
          onClick={goPlay}
        >
          <span className="app-tabs__label">Cook</span>
          <span className="app-tabs__sub">Make a meal</span>
        </button>
        <button
          type="button"
          className={`app-tabs__btn ${tab === "kitchen" ? "app-tabs__btn--active" : ""}`}
          onClick={() => setTab("kitchen")}
        >
          <span className="app-tabs__label">Table</span>
          <span className="app-tabs__sub">Your wins</span>
        </button>
      </nav>

      <AnimatePresence mode="wait">
        {tab === "home" && (
          <TabContent tabKey="home">
            <KitchenHome
              refreshSignal={dataRefreshSignal}
              onPlay={goPlay}
              onKitchen={() => setTab("kitchen")}
            />
          </TabContent>
        )}

        {tab === "play" && (
          <TabContent tabKey="play">
            <FridgeGame
              key={gameKey}
              activeChallengeId={activeChallengeId}
              onCoachUpdated={refreshData}
              onOpenKitchen={() => setTab("kitchen")}
            />
          </TabContent>
        )}

        {tab === "kitchen" && (
          <TabContent tabKey="kitchen">
            <ImpactDashboard refreshSignal={dataRefreshSignal} onPlay={goPlay} />
          </TabContent>
        )}
      </AnimatePresence>
    </>
  );
}
