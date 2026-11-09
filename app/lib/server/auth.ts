import { createHmac, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from '@/app/lib/server/db';
import { errors } from '@/app/lib/server/http';
import { can, permissionsOf, type Permission } from '@/app/lib/staff';
import type { Role, User, UserPreferences } from '@/generated/prisma/client';

export const SESSION_COOKIE = 'mn_session';
const BCRYPT_COST = 12; // README 9.1
const DAY = 24 * 60 * 60 * 1000;
const persistentDays = () => Number(process.env.AUTH_SESSION_MAX_AGE_DAYS ?? 30);
const BROWSER_SESSION_MS = DAY; // "remember me" off: cookie dies with the browser, server copy after 1 day
const TOUCH_EVERY_MS = 5 * 60 * 1000;

// ─── Passwords ──────────────────────────────────────────────────────────────

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);

export async function verifyPassword(password: string, hash: string | null | undefined) {
  const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return ok && !!hash;
}

// ─── Tokens ─────────────────────────────────────────────────────────────────

const newToken = () => randomBytes(32).toString('base64url');

// HMAC with AUTH_SECRET so a leaked database alone can't be used to forge or check tokens.
function hashToken(token: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be set to a random string of 32+ characters');
  return createHmac('sha256', secret).update(token).digest('hex');
}

// ─── Sessions ───────────────────────────────────────────────────────────────

export type SessionUser = User & { preferences: UserPreferences | null };
export interface CurrentSession {
  sessionId: string;
  user: SessionUser;
}

/** Staff sessions: browser session, and at most this long on the server (no sliding, no "remember me"). */
export const STAFF_SESSION_MS = 8 * 60 * 60 * 1000;

export async function createSession(userId: string, persistent: boolean, userAgent?: string | null, maxAgeOverrideMs?: number) {
  const token = newToken();
  const maxAgeMs = maxAgeOverrideMs ?? (persistent ? persistentDays() * DAY : BROWSER_SESSION_MS);
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      persistent,
      expiresAt: new Date(Date.now() + maxAgeMs),
      userAgent: userAgent?.slice(0, 255),
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(persistent ? { maxAge: Math.floor(maxAgeMs / 1000) } : {}),
  });
}

export async function getSession(): Promise<CurrentSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { preferences: true } } },
  });
  if (!session || session.expiresAt <= new Date() || session.user.deletedAt || session.user.disabledAt) return null;

  // Keep lastUsedAt fresh and slide "remember me" sessions forward, at most every few minutes.
  if (Date.now() - session.lastUsedAt.getTime() > TOUCH_EVERY_MS) {
    await db.session.update({
      where: { id: session.id },
      data: {
        lastUsedAt: new Date(),
        ...(session.persistent ? { expiresAt: new Date(Date.now() + persistentDays() * DAY) } : {}),
      },
    });
  }
  return { sessionId: session.id, user: session.user };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

/** Sign out everywhere else, e.g. after a password change. */
export const destroyOtherSessions = (userId: string, keepSessionId: string) =>
  db.session.deleteMany({ where: { userId, NOT: { id: keepSessionId } } });

export async function requireUser(): Promise<CurrentSession> {
  const session = await getSession();
  if (!session) throw errors.unauthenticated();
  return session;
}

/**
 * Staff-only endpoints. Anyone without the permission (customers, signed-out, other staff roles)
 * gets the same 404 as a missing page, so the admin API doesn't reveal itself.
 */
export async function requirePermission(permission: Permission): Promise<CurrentSession> {
  const session = await getSession();
  if (!session || !can(session.user, permission)) throw errors.notFound();
  return session;
}

export async function requireRole(...roles: Role[]): Promise<CurrentSession> {
  const session = await requireUser();
  if (!roles.includes(session.user.role)) throw errors.forbidden();
  return session;
}

/**
 * Provider-only pages and endpoints: a signed-in `provider` account linked to an active provider
 * profile. Returns the profile too. Anyone else gets a 404, like the admin area.
 */
export async function requireProvider() {
  const session = await getSession();
  if (!session || session.user.role !== 'provider') throw errors.notFound();
  const provider = await db.provider.findUnique({ where: { userId: session.user.id } });
  if (!provider?.active) throw errors.notFound();
  return { ...session, provider };
}

// ─── Serialization ──────────────────────────────────────────────────────────

export function serializeUser(user: SessionUser) {
  const p = user.preferences;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    emailVerified: !!user.emailVerifiedAt,
    staffRole: user.role === 'admin' ? user.staffRole : null,
    permissions: permissionsOf(user),
    createdAt: user.createdAt.toISOString(),
    preferences: {
      language: p?.language ?? 'en',
      timezone: p?.timezone ?? 'America/New_York',
      dateFormat: p?.dateFormat ?? 'MM/DD/YYYY',
      theme: p?.theme ?? 'light',
      notifications: {
        booking: p?.notifyBooking ?? true,
        messages: p?.notifyMessages ?? true,
        promos: p?.notifyPromos ?? false,
        news: p?.notifyNews ?? false,
      },
    },
  };
}
