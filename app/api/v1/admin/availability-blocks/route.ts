import { createBlock, listBlocks } from '@/app/lib/server/admin';
import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json, parseJson, parseQuery } from '@/app/lib/server/http';
import { blockCreateSchema, blocksQuery } from '@/app/lib/validation/admin';

// GET /api/v1/admin/availability-blocks?from= — closures from today (or `from`) for 180 days.
export const GET = handler(async (req) => {
  await requirePermission('availability.manage');
  return json(await listBlocks(parseQuery(req, blocksQuery).from));
});

// POST /api/v1/admin/availability-blocks — { date, slot?, serviceType?, areaId?, reason? }. Null means
// "all" (whole day, every service, every area). Existing bookings aren't moved; the count is returned.
export const POST = handler(async (req) => {
  const { user } = await requirePermission('availability.manage');
  const input = await parseJson(req, blockCreateSchema);
  const result = await createBlock(input);
  await audit(req, user, {
    action: 'availability.block',
    targetType: 'availability_block',
    targetId: result.id,
    summary: `Blocked ${input.date}${input.slot ? ` at ${input.slot}` : ' (whole day)'}${input.serviceType ? ` for ${input.serviceType}` : ''}${input.reason ? `: ${input.reason}` : ''}`,
    metadata: input,
  });
  return json(result, { status: 201 });
});
