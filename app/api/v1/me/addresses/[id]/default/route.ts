import { listAddresses, ownedAddress } from '@/app/lib/server/addresses';
import { requireUser } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';
import { handler, json } from '@/app/lib/server/http';

// POST /api/v1/me/addresses/:id/default — makes this the default and unsets the others.
export const POST = handler<{ id: string }>(async (_req, { params }) => {
  const { user } = await requireUser();
  await ownedAddress(user.id, params.id);
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id: params.id }, data: { isDefault: true } }),
  ]);
  return json({ items: await listAddresses(user.id) });
});
