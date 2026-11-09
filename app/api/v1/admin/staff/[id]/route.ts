import { updateStaff } from '@/app/lib/server/admin';
import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { staffUpdateSchema } from '@/app/lib/validation/admin';

// PATCH /api/v1/admin/staff/:id — { staffRole?, disabled? }. Signs them out so it applies now.
// Not on yourself, and never leaves the team without an active manager.
export const PATCH = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requirePermission('staff.manage');
  const input = await parseJson(req, staffUpdateSchema);
  const { staff, before } = await updateStaff(user.id, params.id, input);
  const parts = [
    input.staffRole && input.staffRole !== before.staffRole ? `role ${before.staffRole} → ${input.staffRole}` : null,
    input.disabled !== undefined && input.disabled !== before.disabled ? (input.disabled ? 'disabled access' : 'restored access') : null,
  ].filter(Boolean);
  await audit(req, user, {
    action: input.disabled ? 'staff.disable' : 'staff.update',
    targetType: 'user',
    targetId: staff.id,
    summary: `${staff.name}: ${parts.join(', ') || 'no change'}`,
    metadata: { before: { staffRole: before.staffRole, disabled: before.disabled }, after: { staffRole: staff.staffRole, disabled: staff.disabled } },
  });
  return json({ staff });
});
