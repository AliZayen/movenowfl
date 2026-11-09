import { db } from '@/app/lib/server/db';
import { handler, json } from '@/app/lib/server/http';

// GET /api/v1/services — public catalog with starting prices.
export const GET = handler(async () => {
  const services = await db.service.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  return json({
    items: services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      startingPriceCents: s.startingPriceCents,
      imageUrl: s.imageUrl,
      imageAlt: s.imageAlt,
    })),
  });
});
