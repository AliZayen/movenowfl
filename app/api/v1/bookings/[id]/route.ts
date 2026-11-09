import { requireUser } from '@/app/lib/server/auth';
import { getBookingFor, modifyBooking, serializeDetail } from '@/app/lib/server/bookings';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { modifyBookingSchema } from '@/app/lib/validation/booking';

type Params = { id: string };

// GET /api/v1/bookings/:id — :id can be the UUID or the ref (MN-2026-0001).
// Includes addresses, access info, details, photos, provider, events, timeline and what the viewer may do.
export const GET = handler<Params>(async (_req, { params }) => {
  const { user } = await requireUser();
  return json({ booking: serializeDetail(await getBookingFor(user, params.id), user) });
});

// PATCH /api/v1/bookings/:id — { notes?, details?, origin?, destination? }. 409 within 24h of the window.
export const PATCH = handler<Params>(async (req, { params }) => {
  const { user } = await requireUser();
  const input = await parseJson(req, modifyBookingSchema);
  return json({ booking: await modifyBooking(user, params.id, input) });
});
