import { db } from '@/app/lib/server/db';
import { handler, json } from '@/app/lib/server/http';

// GET /api/v1/service-areas — names for the landing page.
export const GET = handler(async () => {
  const areas = await db.serviceArea.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  return json({ items: areas.map((a) => ({ id: a.id, name: a.name, zipCount: a.zips.length })) });
});
