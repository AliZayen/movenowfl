import { db } from '@/app/lib/server/db';
import { clientIp, handler, json, parseJson } from '@/app/lib/server/http';
import { issueOtp, otpStep, resendOtp } from '@/app/lib/server/otp';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { resendCodeSchema } from '@/app/lib/validation/auth';

// POST /api/v1/auth/signup/resend — { email }. New code for a pending sign-up or an unverified account.
// Always the same answer, so it can't be used to find out which emails exist.
export const POST = handler(async (req) => {
  rateLimit(`otp-resend:${clientIp(req)}`, ...LIMITS.passwordEmail);
  const { email } = await parseJson(req, resendCodeSchema);
  rateLimit(`otp-send:${email}`, ...LIMITS.passwordEmail);

  if (!(await resendOtp(email, 'signup'))) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true, emailVerifiedAt: true, deletedAt: true } });
    if (user && !user.emailVerifiedAt && !user.deletedAt) await issueOtp({ email, purpose: 'signup', userId: user.id });
  }
  return json({ ok: true, ...otpStep(email), message: `If a sign-up is waiting for ${email}, we've sent a new code.` });
});
