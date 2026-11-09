import { listCustomers } from '@/app/lib/server/admin';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json, parseQuery } from '@/app/lib/server/http';
import { customersQuery } from '@/app/lib/validation/admin';

// GET /api/v1/admin/customers?q=&page=&pageSize= — read-only; q matches name, email or phone.
export const GET = handler(async (req) => {
  await requirePermission('customers.view');
  return json(await listCustomers(parseQuery(req, customersQuery)));
});
