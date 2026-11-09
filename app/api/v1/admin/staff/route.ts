import { createStaff, listStaff } from '@/app/lib/server/admin';
import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { staffCreateSchema } from '@/app/lib/validation/admin';

// GET /api/v1/admin/staff — managers only.
export const GET = handler(async () => {
  await requirePermission('staff.manage');
  return json(await listStaff());
});

// POST /api/v1/admin/staff — { email, fullName, staffRole }. Emails an invite; they set a password
// with "Forgot password".
export const POST = handler(async (req) => {
  const { user } = await requirePermission('staff.manage');
  const staff = await createStaff(await parseJson(req, staffCreateSchema));
  await audit(req, user, { action: 'staff.create', targetType: 'user', targetId: staff.id, summary: `Added ${staff.name} (${staff.email}) as ${staff.staffRole}` });
  return json({ staff }, { status: 201 });
});
