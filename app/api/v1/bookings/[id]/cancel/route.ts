import { requireUser } from '@/app/lib/server/auth';
import { cancelBooking } from '@/app/lib/server/bookings';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { cancelSchema } from '@/app/lib/validation/booking';

// POST /api/v1/bookings/:id/cancel — { reason? }. 409 if already completed or cancelled.
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requireUser();
  const input = await parseJson(req, cancelSchema);
  return json({ booking: await cancelBooking(user, params.id, input) });
});
