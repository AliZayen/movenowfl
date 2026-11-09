import { createSession, serializeUser, STAFF_SESSION_MS } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { audit } from '@/app/lib/server/audit';
import { clientIp, errors, handler, json, parseJson } from '@/app/lib/server/http';
import { consumeOtp } from '@/app/lib/server/otp';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { verifySignUpSchema } from '@/app/lib/validation/auth';

// POST /api/v1/auth/signin/verify — { email, code }. Second step of a staff sign-in (after the
// password, which emailed the code). Staff sessions last 8 hours at most and end with the browser.
export const POST = handler(async (req) => {
  rateLimit(`otp-verify:${clientIp(req)}`, ...LIMITS.otpVerify);
  const { email, code } = await parseJson(req, verifySignUpSchema);
  const row = await consumeOtp(email, 'admin_login', code);
  const user = row.userId ? await db.user.findUnique({ where: { id: row.userId }, include: { preferences: true } }) : null;
  if (!user || user.role !== 'admin' || user.disabledAt || user.deletedAt) throw errors.validation('That code is invalid or has expired.');

  await createSession(user.id, false, req.headers.get('user-agent'), STAFF_SESSION_MS);
  await audit(req, user, { action: 'staff.sign_in', targetType: 'user', targetId: user.id, summary: `${user.fullName || user.email} signed in` });
  return json({ user: serializeUser(user) });
});
