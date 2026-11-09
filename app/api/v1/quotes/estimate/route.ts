import { estimateBooking } from '@/app/lib/server/bookings';
import { clientIp, errors, handler, json } from '@/app/lib/server/http';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { todayInFlorida } from '@/app/lib/server/time';
import { createBookingSchema } from '@/app/lib/validation/booking';

type Loc = Record<string, unknown> | undefined;

// POST /api/v1/quotes/estimate — same body as POST /bookings; returns a price estimate without booking.
// Public, so the summary sidebar can show a price before the customer has finished the form. Date, time
// and street don't affect the price, so they're optional here (filled with neutral defaults).
export const POST = handler(async (req) => {
  rateLimit(`estimate:${clientIp(req)}`, ...LIMITS.estimate);
  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    throw errors.validation('Request body must be valid JSON');
  }
  const withDefaults = (loc: Loc) => (loc ? { street: 'TBD', city: 'TBD', ...loc } : loc);
  const body = {
    scheduledDate: todayInFlorida(),
    preferredSlot: '08:00',
    ...raw,
    origin: withDefaults(raw.origin as Loc),
    ...(raw.destination ? { destination: withDefaults(raw.destination as Loc) } : {}),
  };
  const result = createBookingSchema.safeParse(body);
  if (!result.success) throw result.error; // handler() turns this into a 400 with field errors
  return json(await estimateBooking(result.data));
});
