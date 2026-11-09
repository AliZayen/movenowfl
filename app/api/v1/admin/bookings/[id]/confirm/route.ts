import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { adminConfirm } from '@/app/lib/server/bookings';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { adminConfirmSchema } from '@/app/lib/validation/booking';

// POST /api/v1/admin/bookings/:id/confirm — { providerId, windowStart, windowEnd, finalPriceCents?, estimatedDurationMin? }
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requirePermission('bookings.manage');
  const input = await parseJson(req, adminConfirmSchema);
  const booking = await adminConfirm(user, params.id, input);
  await audit(req, user, {
    action: 'booking.confirm',
    targetType: 'booking',
    targetId: booking.id,
    summary: `Confirmed ${booking.ref} with ${booking.provider?.name ?? 'a provider'}, ${input.windowStart}–${input.windowEnd}`,
    metadata: input,
  });
  return json({ booking });
});
