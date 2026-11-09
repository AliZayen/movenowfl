import { listAddresses, MAX_SAVED_ADDRESSES, serializeAddress } from '@/app/lib/server/addresses';
import { requireUser } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { errors, handler, json, parseJson } from '@/app/lib/server/http';
import { createAddressSchema } from '@/app/lib/validation/profile';

// GET /api/v1/me/addresses — saved addresses, default first.
export const GET = handler(async () => {
  const { user } = await requireUser();
  return json({ items: await listAddresses(user.id) });
});

// POST /api/v1/me/addresses — the first address becomes the default automatically.
export const POST = handler(async (req) => {
  const { user } = await requireUser();
  const { isDefault, ...input } = await parseJson(req, createAddressSchema);

  const address = await db.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId: user.id } });
    if (count >= MAX_SAVED_ADDRESSES) throw errors.conflict(`You can save up to ${MAX_SAVED_ADDRESSES} addresses`);
    const makeDefault = isDefault || count === 0;
    if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    return tx.address.create({ data: { ...input, apt: input.apt || null, userId: user.id, isDefault: makeDefault } });
  });
  return json({ address: serializeAddress(address) }, { status: 201 });
});
