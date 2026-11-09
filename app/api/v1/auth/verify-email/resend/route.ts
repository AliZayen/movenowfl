import { requireUser } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';
import { issueOtp, otpStep } from '@/app/lib/server/otp';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';

// POST /api/v1/auth/verify-email/resend — email a 6-digit code to the signed-in user (one a minute).
export const POST = handler(async () => {
  const { user } = await requireUser();
  if (user.emailVerifiedAt) return json({ ok: true, alreadyVerified: true });
  rateLimit(`otp-send:${user.email}`, ...LIMITS.passwordEmail);
  await issueOtp({ email: user.email, purpose: 'signup', userId: user.id });
  return json({ ok: true, ...otpStep(user.email) });
});
