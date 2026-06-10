"use client";

import { useState } from "react";

type SignInPanelProps = {
  onSignedIn: () => void;
  onGuest: () => void;
};

export function SignInPanel({ onSignedIn, onGuest }: SignInPanelProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Could not sign in");
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-in-overlay" role="dialog" aria-modal="true" aria-labelledby="sign-in-title">
      <section className="panel sign-in-panel">
        <h2 id="sign-in-title">Welcome to Barefeast</h2>
        <p className="sign-in-panel__copy">
          Tell us your name and we&apos;ll remember your larder, recipes, and coach notes.
        </p>
        <label htmlFor="sign-in-name">Your name</label>
        <input
          id="sign-in-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sam"
          autoComplete="name"
          maxLength={50}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="primary-btn sign-in-panel__submit"
          disabled={loading || name.trim().length < 1}
          onClick={() => void submit()}
        >
          {loading ? "Setting your place…" : "Take your seat"}
        </button>
        <button type="button" className="sign-in-panel__guest" onClick={onGuest}>
          Continue as guest
        </button>
        <p className="sign-in-panel__hint stamp-label">No password yet — just your name for now.</p>
      </section>
    </div>
  );
}
