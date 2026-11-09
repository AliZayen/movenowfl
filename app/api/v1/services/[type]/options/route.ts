import { db } from '@/app/lib/server/db';
import { errors, handler, json } from '@/app/lib/server/http';
import { isServiceType } from '@/app/lib/server/pricing';

// GET /api/v1/services/:type/options — dropdown values for that service's booking form.
export const GET = handler<{ type: string }>(async (_req, { params }) => {
  if (!isServiceType(params.type)) throw errors.notFound('Service');
  const service = await db.service.findUnique({ where: { id: params.type } });
  if (!service?.active) throw errors.notFound('Service');
  return json({ service: service.id, options: service.options });
});
