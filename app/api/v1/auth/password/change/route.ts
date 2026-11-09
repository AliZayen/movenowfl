import { destroyOtherSessions, hashPassword, requireUser, verifyPassword } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { sendEmail } from '@/app/lib/server/email';
import { errors, handler, json, parseJson } from '@/app/lib/server/http';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { changePasswordSchema } from '@/app/lib/validation/auth';

// POST /api/v1/auth/password/change — Profile → Security. Signs out the user's other sessions.
export const POST = handler(async (req) => {
  const { sessionId, user } = await requireUser();
  rateLimit(`pw-change:${user.id}`, ...LIMITS.passwordChange);
  const input = await parseJson(req, changePasswordSchema);

  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw errors.validation('Your current password is incorrect', { currentPassword: 'Incorrect password' });
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.newPassword) } });
  await destroyOtherSessions(user.id, sessionId);
  // A notice only: the password has already changed, so a failed send must not fail the request.
  await sendEmail({
    to: user.email,
    subject: 'Your MoveNow password was changed',
    text: "Your password was just changed. If this wasn't you, reset it right away.",
  }).catch(() => undefined);
  return json({ ok: true });
});
