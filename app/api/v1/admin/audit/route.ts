import { listAudit } from '@/app/lib/server/admin';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json, parseQuery } from '@/app/lib/server/http';
import { auditQuery } from '@/app/lib/validation/admin';

// GET /api/v1/admin/audit?targetType=&targetId=&actorId=&page= — newest first. Managers only.
export const GET = handler(async (req) => {
  await requirePermission('audit.view');
  return json(await listAudit(parseQuery(req, auditQuery)));
});
