import { db } from '@/app/lib/server/db';
import { handler, json } from '@/app/lib/server/http';

// GET /api/health — 200 when the app can reach the database.
export const GET = handler(async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    return json({ status: 'ok', database: 'up' });
  } catch {
    return json({ status: 'degraded', database: 'down' }, { status: 503 });
  }
});
