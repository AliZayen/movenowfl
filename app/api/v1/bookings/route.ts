import { requireUser } from '@/app/lib/server/auth';
import { createBooking, listBookings } from '@/app/lib/server/bookings';
import { handler, json, parseJson, parseQuery } from '@/app/lib/server/http';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { createBookingSchema, listBookingsQuery } from '@/app/lib/validation/booking';

// GET /api/v1/bookings?q=&status=&service=&from=&to=&upcoming=&page=&pageSize=&sort=
// Customers see their own bookings, providers the jobs assigned to them, admins everything.
export const GET = handler(async (req) => {
  const { user } = await requireUser();
  const query = parseQuery(req, listBookingsQuery);
  return json(await listBookings(user, query));
});

// POST /api/v1/bookings — create a booking request (status "pending"). Requires sign-in (README 13 #3).
export const POST = handler(async (req) => {
  const { user } = await requireUser();
  rateLimit(`create-booking:${user.id}`, ...LIMITS.createBooking);
  const input = await parseJson(req, createBookingSchema);
  return json({ booking: await createBooking(user, input) }, { status: 201 });
});
