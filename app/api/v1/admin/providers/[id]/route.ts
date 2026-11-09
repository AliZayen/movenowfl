import { updateProvider } from '@/app/lib/server/admin';
import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { providerUpdateSchema } from '@/app/lib/validation/admin';

// PATCH /api/v1/admin/providers/:id — any provider field; `active: false` stops new assignments.
export const PATCH = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requirePermission('providers.manage');
  const input = await parseJson(req, providerUpdateSchema);
  const { provider, before } = await updateProvider(params.id, input);
  const what = input.active !== undefined && input.active !== before.active ? (input.active ? 'Reactivated' : 'Deactivated') : 'Updated';
  await audit(req, user, { action: 'provider.update', targetType: 'provider', targetId: provider.id, summary: `${what} provider ${provider.name}`, metadata: { changes: input } });
  return json({ provider });
});
