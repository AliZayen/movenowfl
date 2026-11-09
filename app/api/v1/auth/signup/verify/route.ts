import { createSession, serializeUser } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { clientIp, errors, handler, json, parseJson } from '@/app/lib/server/http';
import { consumeOtp } from '@/app/lib/server/otp';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { verifySignUpSchema } from '@/app/lib/validation/auth';

interface PendingSignUp {
  passwordHash?: string;
  fullName?: string | null;
  phone?: string | null;
}

// POST /api/v1/auth/signup/verify — { email, code, remember? }. Step 2: confirms the email, creates the
// account (or finishes an unverified one) and signs in.
export const POST = handler(async (req) => {
  rateLimit(`otp-verify:${clientIp(req)}`, ...LIMITS.otpVerify);
  const { email, code, remember } = await parseJson(req, verifySignUpSchema);
  const row = await consumeOtp(email, 'signup', code);
  const pending = (row.payload ?? {}) as PendingSignUp;
  const now = new Date();

  const existing = await db.user.findUnique({ where: { email } });
  let user;
  if (existing) {
    if (existing.deletedAt) throw errors.notFound('Account');
    // A sign-up on an old unverified account sets the password chosen now; the code proves the
    // email is theirs, so any older sessions on that account are signed out.
    const takeOver = !!pending.passwordHash && !existing.emailVerifiedAt;
    user = await db.user.update({
      where: { id: existing.id },
      data: {
        emailVerifiedAt: existing.emailVerifiedAt ?? now,
        ...(takeOver
          ? {
              passwordHash: pending.passwordHash,
              fullName: pending.fullName || existing.fullName,
              phone: pending.phone ?? existing.phone,
              sessions: { deleteMany: {} },
            }
          : {}),
      },
      include: { preferences: true },
    });
  } else {
    if (!pending.passwordHash) throw errors.validation('Please start the sign-up again.');
    user = await db.user.create({
      data: {
        email,
        passwordHash: pending.passwordHash,
        fullName: pending.fullName ?? '',
        phone: pending.phone ?? undefined,
        emailVerifiedAt: now,
        preferences: { create: {} },
      },
      include: { preferences: true },
    });
  }

  await createSession(user.id, remember, req.headers.get('user-agent'));
  return json({ user: serializeUser(user) }, { status: existing ? 200 : 201 });
});
