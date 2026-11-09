import { hashPassword } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { clientIp, errors, handler, json, parseJson } from '@/app/lib/server/http';
import { issueOtp, otpStep } from '@/app/lib/server/otp';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { signUpSchema } from '@/app/lib/validation/auth';

// POST /api/v1/auth/signup — step 1 of 2. Emails a 6-digit code; nothing is created and no one is
// signed in until POST /auth/signup/verify gets the right code. The chosen password waits (hashed)
// with the code.
export const POST = handler(async (req) => {
  rateLimit(`signup:${clientIp(req)}`, ...LIMITS.signUp);
  const input = await parseJson(req, signUpSchema);
  rateLimit(`otp-send:${input.email}`, ...LIMITS.passwordEmail);

  const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true, emailVerifiedAt: true } });
  if (existing?.emailVerifiedAt) throw errors.conflict('An account with this email already exists. Try signing in.');

  await issueOtp({
    email: input.email,
    purpose: 'signup',
    userId: existing?.id, // an older account that never confirmed its email
    payload: { passwordHash: await hashPassword(input.password), fullName: input.fullName ?? null, phone: input.phone ?? null },
  });

  return json(
    { pending: true, ...otpStep(input.email), message: `We sent a 6-digit code to ${input.email}. Enter it to finish signing up.` },
    { status: 202 },
  );
});
