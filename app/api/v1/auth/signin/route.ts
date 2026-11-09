import { createSession, serializeUser, verifyPassword } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { ApiError, clientIp, errors, handler, json, parseJson } from '@/app/lib/server/http';
import { issueOtp } from '@/app/lib/server/otp';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { signInSchema } from '@/app/lib/validation/auth';

// POST /api/v1/auth/signin — `remember: true` keeps the session for 30 days, otherwise until the browser closes.
export const POST = handler(async (req) => {
  const input = await parseJson(req, signInSchema);
  rateLimit(`signin:${clientIp(req)}`, ...LIMITS.signIn);
  rateLimit(`signin-email:${input.email}`, ...LIMITS.signIn);

  const user = await db.user.findUnique({ where: { email: input.email }, include: { preferences: true } });
  const ok = await verifyPassword(input.password, user?.passwordHash); // runs even if the user is missing
  if (!user || !ok || user.deletedAt || user.disabledAt) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Email or password is incorrect');
  }
  // Right password but the email was never confirmed: send a code (at most one a minute) and let
  // the client show the code step. Only reached with the correct password, so it reveals nothing.
  if (!user.emailVerifiedAt) {
    await issueOtp({ email: user.email, purpose: 'signup', userId: user.id });
    throw new ApiError(403, 'EMAIL_NOT_VERIFIED', `Please confirm your email first. We sent a 6-digit code to ${user.email}.`);
  }

  // Pro accounts sign in like customers, but only while linked to an active provider profile.
  if (user.role === 'provider') {
    const provider = await db.provider.findUnique({ where: { userId: user.id }, select: { active: true } });
    if (!provider?.active) throw errors.forbidden("This pro account isn't active. Please contact MoveNow dispatch.");
  }

  // Staff accounts always need a second step: a 6-digit code by email, then an 8-hour session.
  if (user.role === 'admin') {
    await issueOtp({ email: user.email, purpose: 'admin_login', userId: user.id });
    throw new ApiError(403, 'MFA_REQUIRED', `For staff accounts we also need a 6-digit code. We sent it to ${user.email}.`);
  }

  await createSession(user.id, input.remember, req.headers.get('user-agent'));
  return json({ user: serializeUser(user) });
});
