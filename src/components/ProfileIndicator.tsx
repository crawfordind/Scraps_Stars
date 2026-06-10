"use client";

import type { AuthSession } from "@/lib/auth/types";

type ProfileIndicatorProps = {
  session: AuthSession;
  onSignOut: () => void;
  signingOut?: boolean;
};

export function ProfileIndicator({ session, onSignOut, signingOut = false }: ProfileIndicatorProps) {
  const initial = session.displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="profile-indicator">
      <span className="profile-indicator__avatar" aria-hidden="true">
        {session.avatarEmoji ?? initial}
      </span>
      <span className="profile-indicator__name">{session.displayName}</span>
      {session.handle && (
        <span className="profile-indicator__handle stamp-label">@{session.handle}</span>
      )}
      <button
        type="button"
        className="profile-indicator__sign-out"
        onClick={() => void onSignOut()}
        disabled={signingOut}
      >
        {signingOut ? "Leaving…" : "Sign out"}
      </button>
    </div>
  );
}
