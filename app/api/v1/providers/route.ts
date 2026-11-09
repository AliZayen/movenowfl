import { z } from 'zod';
import { serializeProvider } from '@/app/lib/server/bookings';
import { db } from '@/app/lib/server/db';
import { handler, json, parseQuery } from '@/app/lib/server/http';
import { zServiceType, zZip } from '@/app/lib/validation/common';
import type { Prisma } from '@/generated/prisma/client';

const query = z.object({ service: zServiceType.optional(), zip: zZip.optional() });

// GET /api/v1/providers?service=&zip= — active providers, best rated first. Used when assigning a job.
export const GET = handler(async (req) => {
  const { service, zip } = parseQuery(req, query);
  const where: Prisma.ProviderWhereInput = {
    active: true,
    ...(service ? { services: { has: service } } : {}),
    ...(zip ? { serviceAreas: { some: { active: true, zips: { has: zip } } } } : {}),
  };
  const providers = await db.provider.findMany({ where, orderBy: [{ ratingAvg: 'desc' }, { reviewCount: 'desc' }] });
  return json({ items: providers.map((p) => ({ ...serializeProvider(p), services: p.services })) });
});
