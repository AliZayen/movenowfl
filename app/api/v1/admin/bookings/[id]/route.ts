import { getAdminBooking } from '@/app/lib/server/admin';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';

// GET /api/v1/admin/bookings/:id — booking (UUID or ref), customer, providers who can take it
// (with their other jobs that day), and the staff actions on it.
export const GET = handler<{ id: string }>(async (_req, { params }) => {
  const { user } = await requirePermission('bookings.view');
  return json(await getAdminBooking(user, params.id));
});
