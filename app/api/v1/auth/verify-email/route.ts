import { requireUser } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { clientIp, handler, json, parseJson } from '@/app/lib/server/http';
import { consumeOtp } from '@/app/lib/server/otp';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { verifyEmailSchema } from '@/app/lib/validation/auth';

// POST /api/v1/auth/verify-email — { code }. For a signed-in account that hasn't confirmed its email
// (accounts created before codes existed). New sign-ups verify through /auth/signup/verify.
export const POST = handler(async (req) => {
  const { user } = await requireUser();
  if (user.emailVerifiedAt) return json({ ok: true, alreadyVerified: true });
  rateLimit(`otp-verify:${clientIp(req)}`, ...LIMITS.otpVerify);
  const { code } = await parseJson(req, verifyEmailSchema);
  await consumeOtp(user.email, 'signup', code);
  await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  return json({ ok: true });
});
