import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { AuthProvider } from "@/lib/auth/providers";
import type { AuthSession } from "@/lib/auth/types";
import { DEMO_USER_ID, ensureDemoUser } from "@/lib/db/user";
import { AUTH_COOKIE } from "./constants";

export { AUTH_COOKIE, AUTH_STORAGE_KEY } from "./constants";

/**
 * Identity layers (see also lib/auth/types.ts):
 *
 * 1. Auth session — httpOnly `sts_token` cookie → users.auth_token.
 *    Established by POST /api/auth/sign-in (name) or POST /api/identity (handle claim).
 *    Cleared by POST /api/auth/sign-out.
 *
 * 2. User profile — users row: name (displayName), email, authProvider, xp, etc.
 *
 * 3. Challenge handle — optional users.handle + avatarEmoji for leaderboard display.
 *    May be claimed on an existing auth session or via a standalone anon account.
 */

export const handleSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9_]+$/, "Handle must be lowercase letters, numbers, or underscores");

export const identitySchema = z.object({
  handle: handleSchema,
  avatarEmoji: z.string().min(1).max(8),
});

export const signInNameSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name").max(50),
});

export type IdentityProfile = {
  id: string;
  /** Display name from auth session (`users.name`). */
  name: string;
  /** Optional leaderboard alias — only when explicitly claimed on this account. */
  handle: string | null;
  avatarEmoji: string;
  xp: number;
  level: number;
  isDemo: boolean;
};

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, authCookieOptions());
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function getUserByAuthToken(token: string) {
  return db.select().from(users).where(eq(users.authToken, token)).get();
}

function toAuthSession(user: typeof users.$inferSelect): AuthSession {
  return {
    id: user.id,
    displayName: user.name,
    email: user.email ?? null,
    authProvider: (user.authProvider as AuthProvider | null) ?? null,
    handle: user.handle ?? null,
    avatarEmoji: user.avatarEmoji ?? null,
    xp: user.xp,
    level: user.level,
  };
}

/** Resolves the signed-in user id from the auth cookie, or falls back to demo-user. */
export async function resolveUserIdFromRequest(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (token) {
    const user = await getUserByAuthToken(token);
    if (user) return user.id;
  }
  await ensureDemoUser();
  return DEMO_USER_ID;
}

/** Returns the full auth session from cookie, or null when unsigned (guest mode). */
export async function resolveAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const user = await getUserByAuthToken(token);
  if (!user || user.id === DEMO_USER_ID) return null;
  return toAuthSession(user);
}

/** Challenge identity — signed-in user profile (handle optional). */
export async function resolveIdentity(): Promise<IdentityProfile | null> {
  const session = await resolveAuthSession();
  if (!session) return null;
  return {
    id: session.id,
    name: session.displayName,
    handle: session.handle,
    avatarEmoji: session.avatarEmoji ?? "🍳",
    xp: session.xp,
    level: session.level,
    isDemo: false,
  };
}

export async function signInWithName(
  input: z.infer<typeof signInNameSchema>,
): Promise<{ session: AuthSession; authToken: string }> {
  const parsed = signInNameSchema.parse(input);
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(AUTH_COOKIE)?.value;

  if (existingToken) {
    const existing = await getUserByAuthToken(existingToken);
    if (existing && existing.id !== DEMO_USER_ID) {
      const updates: {
        name: string;
        handle?: null;
        avatarEmoji?: null;
      } = { name: parsed.displayName };

      // Drop anon-only handle artifacts (name was copied from handle before sign-in).
      if (
        existing.handle &&
        existing.name === existing.handle &&
        existing.name !== parsed.displayName
      ) {
        updates.handle = null;
        updates.avatarEmoji = null;
      }

      await db.update(users).set(updates).where(eq(users.id, existing.id));
      const updated = await db.select().from(users).where(eq(users.id, existing.id)).get();
      if (!updated) throw new Error("Failed to update profile");
      return { authToken: existingToken, session: toAuthSession(updated) };
    }
  }

  const authToken = nanoid(32);
  const userId = `user-${nanoid(10)}`;

  await db.insert(users).values({
    id: userId,
    name: parsed.displayName,
    authToken,
    authProvider: "anonymous",
    createdAt: new Date(),
  });

  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error("Failed to create account");

  return { authToken, session: toAuthSession(user) };
}

export async function signOutSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (token) {
    await db.update(users).set({ authToken: null }).where(eq(users.authToken, token));
  }
  cookieStore.delete(AUTH_COOKIE);
}

export async function claimAnonymousIdentity(input: z.infer<typeof identitySchema>): Promise<{
  user: IdentityProfile;
  authToken: string;
}> {
  const parsed = identitySchema.parse(input);
  const existingHandle = await db.select().from(users).where(eq(users.handle, parsed.handle)).get();
  if (existingHandle) throw new Error("Handle already taken");

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(AUTH_COOKIE)?.value;
  const sessionUser = existingToken ? await getUserByAuthToken(existingToken) : null;

  if (!sessionUser || sessionUser.id === DEMO_USER_ID) {
    throw new Error("Sign in first to claim a handle");
  }

  if (sessionUser.handle) {
    throw new Error("Handle already claimed on this account");
  }

  await db
    .update(users)
    .set({ handle: parsed.handle, avatarEmoji: parsed.avatarEmoji })
    .where(eq(users.id, sessionUser.id));

  const user = await db.select().from(users).where(eq(users.id, sessionUser.id)).get();
  if (!user || !user.handle) throw new Error("Failed to claim handle");

  return {
    authToken: existingToken!,
    user: {
      id: user.id,
      name: user.name,
      handle: user.handle,
      avatarEmoji: user.avatarEmoji ?? parsed.avatarEmoji,
      xp: user.xp,
      level: user.level,
      isDemo: false,
    },
  };
}

export async function getDisplayHandle(userId: string): Promise<string> {
  if (userId === DEMO_USER_ID) return "barefeast_host";
  const user = await db
    .select({ handle: users.handle, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  if (user?.handle) return user.handle;
  if (user?.name) return user.name;
  return "barefeast_host";
}
