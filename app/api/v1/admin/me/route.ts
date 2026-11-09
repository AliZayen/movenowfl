import { requirePermission, serializeUser } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';

// GET /api/v1/admin/me — the signed-in staff member and what they may do (drives the admin menu).
// 404 for anyone who isn't active staff.
export const GET = handler(async () => {
  const { user } = await requirePermission('overview.view');
  return json({ user: serializeUser(user) });
});
