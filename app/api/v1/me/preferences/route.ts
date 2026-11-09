import { requireUser, serializeUser } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { updatePreferencesSchema } from '@/app/lib/validation/profile';

// PATCH /api/v1/me/preferences — language, timezone, date format, theme, notification toggles.
export const PATCH = handler(async (req) => {
  const { user } = await requireUser();
  const { notifications: n, ...rest } = await parseJson(req, updatePreferencesSchema);
  const data = {
    ...rest,
    ...(n?.booking !== undefined ? { notifyBooking: n.booking } : {}),
    ...(n?.messages !== undefined ? { notifyMessages: n.messages } : {}),
    ...(n?.promos !== undefined ? { notifyPromos: n.promos } : {}),
    ...(n?.news !== undefined ? { notifyNews: n.news } : {}),
  };
  await db.userPreferences.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  const updated = await db.user.findUniqueOrThrow({ where: { id: user.id }, include: { preferences: true } });
  return json({ user: serializeUser(updated) });
});
