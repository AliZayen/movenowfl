import { z } from 'zod';
import { db } from '@/app/lib/server/db';
import { handler, json, parseQuery } from '@/app/lib/server/http';
import { zZip } from '@/app/lib/validation/common';

// GET /api/v1/service-areas/check?zip=33139 → { served, area, areas }
// `area` is the most specific match (e.g. "Brickell" rather than "Miami-Dade").
export const GET = handler(async (req) => {
  const { zip } = parseQuery(req, z.object({ zip: zZip }));
  const areas = await db.serviceArea.findMany({ where: { active: true, zips: { has: zip } } });
  areas.sort((a, b) => a.zips.length - b.zips.length);
  return json({ zip, served: areas.length > 0, area: areas[0]?.name ?? null, areas: areas.map((a) => a.name) });
});
