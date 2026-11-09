import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { adminAssign } from '@/app/lib/server/bookings';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { adminAssignSchema } from '@/app/lib/validation/booking';

// POST /api/v1/admin/bookings/:id/assign — { providerId }. Swap the provider on a pending or confirmed job.
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requirePermission('bookings.manage');
  const { providerId } = await parseJson(req, adminAssignSchema);
  const booking = await adminAssign(user, params.id, providerId);
  await audit(req, user, {
    action: 'booking.assign',
    targetType: 'booking',
    targetId: booking.id,
    summary: `Assigned ${booking.provider?.name ?? 'a provider'} to ${booking.ref}`,
    metadata: { providerId },
  });
  return json({ booking });
});
