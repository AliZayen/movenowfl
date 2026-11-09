import { getCustomer } from '@/app/lib/server/admin';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';

// GET /api/v1/admin/customers/:id — profile, saved addresses and bookings. Read-only.
export const GET = handler<{ id: string }>(async (_req, { params }) => {
  await requirePermission('customers.view');
  return json(await getCustomer(params.id));
});
