"use client";

import { useState } from "react";

const AVATAR_OPTIONS = ["🍳", "🥬", "🌶️", "🍋", "🧄", "🥕", "🫕", "✨"];

type IdentityClaimFormProps = {
  displayName?: string;
  onClaimed: (user: { handle: string; avatarEmoji: string; name: string }) => void;
};

export function IdentityClaimForm({ displayName, onClaimed }: IdentityClaimFormProps) {
  const [handle, setHandle] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🍳");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim().toLowerCase(), avatarEmoji }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Could not claim handle");
      onClaimed(json.data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel identity-claim">
      <h2>Claim a leaderboard handle</h2>
      {displayName ? (
        <p>
          You&apos;re competing as <strong>{displayName}</strong>. Add an optional @handle for the
          leaderboard — or skip and use your name.
        </p>
      ) : (
        <p>Under 15 seconds — no password. Needed for the leaderboard.</p>
      )}
      <label htmlFor="handle">Handle (optional)</label>
      <input
        id="handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())}
        placeholder="yourhandle"
        autoComplete="off"
        maxLength={20}
      />
      <p className="identity-claim__avatars">Pick an avatar</p>
      <div className="identity-claim__emoji-row">
        {AVATAR_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`identity-claim__emoji ${avatarEmoji === emoji ? "identity-claim__emoji--active" : ""}`}
            onClick={() => setAvatarEmoji(emoji)}
            aria-pressed={avatarEmoji === emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="primary-btn"
        disabled={loading || handle.trim().length < 3}
        onClick={() => void submit()}
      >
        {loading ? "Claiming…" : "Save handle"}
      </button>
    </section>
  );
}
