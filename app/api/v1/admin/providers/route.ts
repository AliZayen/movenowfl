import { createProvider, listAdminProviders } from '@/app/lib/server/admin';
import { audit } from '@/app/lib/server/audit';
import { requirePermission } from '@/app/lib/server/auth';
import { handler, json, parseJson, parseQuery } from '@/app/lib/server/http';
import { providerInputSchema, providersQuery } from '@/app/lib/validation/admin';

// GET /api/v1/admin/providers?q=&service=&active= — all providers (inactive too) and the area list.
export const GET = handler(async (req) => {
  await requirePermission('providers.view');
  return json(await listAdminProviders(parseQuery(req, providersQuery)));
});

// POST /api/v1/admin/providers — { displayName, phone?, services[], areaIds[], backgroundChecked?, insured?, active? }
export const POST = handler(async (req) => {
  const { user } = await requirePermission('providers.manage');
  const provider = await createProvider(await parseJson(req, providerInputSchema));
  await audit(req, user, { action: 'provider.create', targetType: 'provider', targetId: provider.id, summary: `Added provider ${provider.name}` });
  return json({ provider }, { status: 201 });
});
