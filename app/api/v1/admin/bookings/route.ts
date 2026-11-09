import { listAdminBookings } from '@/app/lib/server/admin';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json, parseQuery } from '@/app/lib/server/http';
import { adminBookingsQuery } from '@/app/lib/validation/admin';

// GET /api/v1/admin/bookings?q=&status=&service=&from=&to=&unassigned=&sort=&page=&pageSize=
// q matches the ref, customer name or email, street, ZIP and provider name.
export const GET = handler(async (req) => {
  await requirePermission('bookings.view');
  return json(await listAdminBookings(parseQuery(req, adminBookingsQuery)));
});
