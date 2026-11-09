import { deleteBlock } from '@/app/lib/server/admin';
import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { handler } from '@/app/lib/server/http';
import { fromDbDate } from '@/app/lib/server/time';

// DELETE /api/v1/admin/availability-blocks/:id — reopens that day or slot.
export const DELETE = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requirePermission('availability.manage');
  const b = await deleteBlock(params.id);
  await audit(req, user, { action: 'availability.unblock', targetType: 'availability_block', targetId: b.id, summary: `Reopened ${fromDbDate(b.date)}${b.slot ? ` at ${b.slot}` : ''}` });
  return new Response(null, { status: 204 });
});
