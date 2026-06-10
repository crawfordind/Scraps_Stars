/**
 * Auth providers for Barefeast.
 *
 * Today: name-only sign-in uses authProvider "anonymous" (no verified email).
 * Later: magic_link will set authProvider "magic_link" after email verification.
 */
export type AuthProvider = "anonymous" | "magic_link";

/** Placeholder — wire email delivery + token verification here. */
export async function signInWithEmail(_email: string): Promise<{ pending: true }> {
  throw new Error("Magic link sign-in is not implemented yet");
}

/** Placeholder — validate one-time token from magic link URL. */
export async function verifyMagicLinkToken(_token: string): Promise<never> {
  throw new Error("Magic link verification is not implemented yet");
}
