import type { AuthProvider } from "./providers";

/**
 * Signed-in user profile returned by GET /api/auth/session.
 *
 * `displayName` maps to `users.name` in the database (kept for backward compat).
 * Challenge handles (`handle`, `avatarEmoji`) are optional — claimed separately
 * via POST /api/identity for leaderboard visibility.
 */
export type AuthSession = {
  id: string;
  displayName: string;
  email: string | null;
  authProvider: AuthProvider | null;
  handle: string | null;
  avatarEmoji: string | null;
  xp: number;
  level: number;
};
