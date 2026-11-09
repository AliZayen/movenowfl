import { destroySession, requireUser, serializeUser, verifyPassword } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { errors, handler, json, parseJson } from '@/app/lib/server/http';
import { avatarKey } from '@/app/lib/server/photos';
import { deleteQuietly } from '@/app/lib/server/storage';
import { deleteAccountSchema, updateMeSchema } from '@/app/lib/validation/profile';

// GET /api/v1/me — the signed-in user with preferences.
export const GET = handler(async () => {
  const { user } = await requireUser();
  return json({ user: serializeUser(user) });
});

// PATCH /api/v1/me — { fullName?, phone? }. Email can't be changed.
export const PATCH = handler(async (req) => {
  const { user } = await requireUser();
  const input = await parseJson(req, updateMeSchema);
  const updated = await db.user.update({ where: { id: user.id }, data: input, include: { preferences: true } });
  return json({ user: serializeUser(updated) });
});

// DELETE /api/v1/me — { password }. Anonymizes the account; bookings stay for the business record.
export const DELETE = handler(async (req) => {
  const { user } = await requireUser();
  const { password } = await parseJson(req, deleteAccountSchema);
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw errors.validation('Password is incorrect', { password: 'Incorrect password' });
  }
  const open = await db.booking.count({ where: { customerId: user.id, status: { in: ['pending', 'confirmed', 'in_progress'] } } });
  if (open > 0) throw errors.conflict('Please cancel or finish your open bookings before deleting your account');

  await db.$transaction([
    db.address.deleteMany({ where: { userId: user.id } }),
    db.otpCode.deleteMany({ where: { OR: [{ userId: user.id }, { email: user.email }] } }),
    db.session.deleteMany({ where: { userId: user.id } }),
    db.user.update({
      where: { id: user.id },
      data: {
        email: `deleted+${user.id}@deleted.invalid`,
        fullName: 'Deleted user',
        phone: null,
        avatarUrl: null,
        passwordHash: null,
        deletedAt: new Date(),
      },
    }),
  ]);
  await deleteQuietly(avatarKey(user.avatarUrl)); // booking photos stay with the kept bookings
  await destroySession();
  return new Response(null, { status: 204 });
});
