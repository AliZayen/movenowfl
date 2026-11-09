import { getAvailability } from '@/app/lib/server/availability';
import { handler, json, parseQuery } from '@/app/lib/server/http';
import { availabilityQuery } from '@/app/lib/validation/booking';

// GET /api/v1/availability?service=moving&zip=33139&date=2026-11-20
// → { date, service, zip, area, capacity, slots: [{ time: "08:00", label: "8:00 AM", available, reason? }] }
export const GET = handler(async (req) => {
  const query = parseQuery(req, availabilityQuery);
  return json(await getAvailability(query));
});
