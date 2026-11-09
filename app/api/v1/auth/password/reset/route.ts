import { hashPassword } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { sendEmail } from '@/app/lib/server/email';
import { clientIp, errors, handler, json, parseJson } from '@/app/lib/server/http';
import { consumeOtp } from '@/app/lib/server/otp';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { resetPasswordSchema } from '@/app/lib/validation/auth';

// POST /api/v1/auth/password/reset — { email, code, newPassword }. Sets the new password and signs out
// every session. The code also proves the email, so an unverified account becomes verified.
export const POST = handler(async (req) => {
  rateLimit(`reset:${clientIp(req)}`, ...LIMITS.otpVerify);
  const { email, code, newPassword } = await parseJson(req, resetPasswordSchema);
  const row = await consumeOtp(email, 'password_reset', code);

  const target = row.userId ? await db.user.findUnique({ where: { id: row.userId } }) : null;
  if (!target || target.deletedAt || target.email !== email) throw errors.validation('That code is invalid or has expired. Request a new one.');

  const passwordHash = await hashPassword(newPassword);
  await db.$transaction([
    db.user.update({ where: { id: target.id }, data: { passwordHash, emailVerifiedAt: target.emailVerifiedAt ?? new Date() } }),
    db.session.deleteMany({ where: { userId: target.id } }),
  ]);
  // A notice only: the password has already changed, so a failed send must not fail the request.
  await sendEmail({
    to: target.email,
    subject: 'Your MoveNow password was changed',
    text: "Your password was just reset. If this wasn't you, contact us right away.",
  }).catch(() => undefined);
  return json({ ok: true, message: 'Password updated. Please sign in with your new password.' });
});
