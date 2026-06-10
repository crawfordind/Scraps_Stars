export const AUTH_COOKIE = "sts_token";
export const AUTH_STORAGE_KEY = "sts_token";

/** Legacy client keys from pre-session identity flows — cleared on auth change. */
export const LEGACY_CLIENT_IDENTITY_KEYS = ["sts_handle", "sts_identity"] as const;
