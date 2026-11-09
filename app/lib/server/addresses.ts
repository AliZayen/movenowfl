import { db } from '@/app/lib/server/db';
import { errors, isUuid } from '@/app/lib/server/http';
import { formatAddress } from '@/app/lib/server/bookings';
import type { Address } from '@/generated/prisma/client';

export const MAX_SAVED_ADDRESSES = 20;

export function serializeAddress(a: Address) {
  return {
    id: a.id,
    label: a.label,
    street: a.street,
    apt: a.apt,
    city: a.city,
    state: a.state,
    zip: a.zip,
    formatted: formatAddress(a),
    isDefault: a.isDefault,
  };
}

export async function listAddresses(userId: string) {
  const rows = await db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return rows.map(serializeAddress);
}

/** Saved address owned by this user, or 404. */
export async function ownedAddress(userId: string, id: string) {
  const address = isUuid(id) ? await db.address.findFirst({ where: { id, userId } }) : null;
  if (!address) throw errors.notFound('Address');
  return address;
}
