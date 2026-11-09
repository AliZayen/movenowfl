import { ownedAddress, serializeAddress } from '@/app/lib/server/addresses';
import { requireUser } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { updateAddressSchema } from '@/app/lib/validation/profile';

type Params = { id: string };

// PATCH /api/v1/me/addresses/:id
export const PATCH = handler<Params>(async (req, { params }) => {
  const { user } = await requireUser();
  await ownedAddress(user.id, params.id);
  const input = await parseJson(req, updateAddressSchema);
  const address = await db.address.update({
    where: { id: params.id },
    data: { ...input, ...(input.apt !== undefined ? { apt: input.apt || null } : {}) },
  });
  return json({ address: serializeAddress(address) });
});

// DELETE /api/v1/me/addresses/:id — if it was the default, the oldest remaining one takes over.
export const DELETE = handler<Params>(async (_req, { params }) => {
  const { user } = await requireUser();
  const address = await ownedAddress(user.id, params.id);
  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: address.id } });
    if (address.isDefault) {
      const next = await tx.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  return new Response(null, { status: 204 });
});
