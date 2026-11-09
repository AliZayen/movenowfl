import { requireUser } from '@/app/lib/server/auth';
import { rescheduleBooking } from '@/app/lib/server/bookings';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { rescheduleSchema } from '@/app/lib/validation/booking';

// POST /api/v1/bookings/:id/reschedule — { date, preferredSlot, reason? }.
// Checks the new slot; a confirmed booking goes back to "pending" until the new window is confirmed.
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requireUser();
  const input = await parseJson(req, rescheduleSchema);
  return json({ booking: await rescheduleBooking(user, params.id, input) });
});
