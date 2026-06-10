"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "@/lib/auth/types";
import { invalidateAfterAuthChange } from "@/lib/api/fetchers";
import { clearStaleClientIdentity } from "@/lib/identity/client";

const GUEST_KEY = "sts_guest_mode";

export function isGuestMode(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(GUEST_KEY) === "1";
}

export function setGuestMode(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) sessionStorage.setItem(GUEST_KEY, "1");
  else sessionStorage.removeItem(GUEST_KEY);
}

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/session");
      const json = await res.json();
      if (json.ok && json.data.session) {
        setSession(json.data.session);
        setGuest(false);
        setGuestMode(false);
        clearStaleClientIdentity();
      } else {
        setSession(null);
        setGuest(isGuestMode());
      }
    } catch {
      setSession(null);
      setGuest(isGuestMode());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (displayName: string) => {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Sign-in failed");
      setSession(json.data.session);
      setGuest(false);
      setGuestMode(false);
      clearStaleClientIdentity();
      invalidateAfterAuthChange();
      return json.data.session as AuthSession;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    setSession(null);
    setGuest(false);
    setGuestMode(false);
    clearStaleClientIdentity();
    invalidateAfterAuthChange();
  }, []);

  const continueAsGuest = useCallback(() => {
    setGuest(true);
    setGuestMode(true);
  }, []);

  const needsSignIn = !loading && !session && !guest;

  return {
    session,
    loading,
    guest,
    needsSignIn,
    signIn,
    signOut,
    continueAsGuest,
    refresh,
  };
}
