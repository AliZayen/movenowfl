import { requireUser, serializeUser } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';

// GET /api/v1/auth/session — the signed-in user with preferences, or 401.
export const GET = handler(async () => {
  const { user } = await requireUser();
  return json({ user: serializeUser(user) });
});
