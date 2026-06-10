import { LEGACY_CLIENT_IDENTITY_KEYS } from "./constants";

/** Remove stale client-side identity caches that can disagree with the auth session. */
export function clearStaleClientIdentity(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_CLIENT_IDENTITY_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
