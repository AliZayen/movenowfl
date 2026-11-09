import { requireUser } from '@/app/lib/server/auth';
import { bookingStats } from '@/app/lib/server/bookings';
import { handler, json, parseQuery } from '@/app/lib/server/http';
import { statsQuery } from '@/app/lib/validation/booking';

// GET /api/v1/bookings/stats?q=&from=&to= — counts per status (same filters as the list) plus "upcoming".
export const GET = handler(async (req) => {
  const { user } = await requireUser();
  return json(await bookingStats(user, parseQuery(req, statsQuery)));
});
