import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { cancelBooking } from '@/app/lib/server/bookings';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { adminCancelSchema } from '@/app/lib/validation/admin';

// POST /api/v1/admin/bookings/:id/cancel — { reason } (required for staff). Works on jobs in progress too.
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requirePermission('bookings.manage');
  const { reason } = await parseJson(req, adminCancelSchema);
  const booking = await cancelBooking(user, params.id, { reason });
  await audit(req, user, { action: 'booking.cancel', targetType: 'booking', targetId: booking.id, summary: `Cancelled ${booking.ref}: ${reason}`, metadata: { reason } });
  return json({ booking });
});
