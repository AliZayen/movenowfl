import { overview } from '@/app/lib/server/admin';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';

// GET /api/v1/admin/overview — counts and the two lists on the admin home: requests waiting for a
// pro (oldest first) and today's jobs.
export const GET = handler(async () => {
  await requirePermission('overview.view');
  return json(await overview());
});
