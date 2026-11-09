import { db } from '@/app/lib/server/db';
import { clientIp, handler, json, parseJson } from '@/app/lib/server/http';
import { issueOtp, otpStep } from '@/app/lib/server/otp';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { forgotPasswordSchema } from '@/app/lib/validation/auth';

// POST /api/v1/auth/password/forgot — { email }. Emails a 6-digit reset code. Always the same answer,
// so it can't be used to find out which emails have accounts. Also used for "Resend code".
export const POST = handler(async (req) => {
  rateLimit(`forgot:${clientIp(req)}`, ...LIMITS.passwordEmail);
  const { email } = await parseJson(req, forgotPasswordSchema);
  rateLimit(`otp-send:${email}`, ...LIMITS.passwordEmail);

  const user = await db.user.findUnique({ where: { email }, select: { id: true, deletedAt: true } });
  if (user && !user.deletedAt) await issueOtp({ email, purpose: 'password_reset', userId: user.id });
  return json({ ok: true, ...otpStep(email), message: `If ${email} has an account, we've sent a 6-digit code to it.` });
});
