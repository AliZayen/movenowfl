import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { adminSetStatus } from '@/app/lib/server/bookings';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { adminStatusSchema } from '@/app/lib/validation/booking';

// POST /api/v1/admin/bookings/:id/status — { status: "in_progress" | "completed" }
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requirePermission('bookings.manage');
  const { status } = await parseJson(req, adminStatusSchema);
  const booking = await adminSetStatus(user, params.id, status);
  await audit(req, user, {
    action: status === 'in_progress' ? 'booking.start' : 'booking.complete',
    targetType: 'booking',
    targetId: booking.id,
    summary: `${status === 'in_progress' ? 'Started' : 'Completed'} ${booking.ref}`,
  });
  return json({ booking });
});
