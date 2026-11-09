import { requireUser } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';
import { markRead } from '@/app/lib/server/messaging';

// POST /api/v1/conversations/:id/read — marks the other side's messages read; returns { marked }.
export const POST = handler<{ id: string }>(async (_req, { params }) => {
  const { user } = await requireUser();
  return json(await markRead(user, params.id));
});
