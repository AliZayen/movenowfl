import { requireUser } from '@/app/lib/server/auth';
import { handler, json, parseJson, parseQuery } from '@/app/lib/server/http';
import { listMessages, sendMessage } from '@/app/lib/server/messaging';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { listMessagesQuery, sendMessageSchema } from '@/app/lib/validation/messaging';

// GET /api/v1/conversations/:id/messages?before=&after=&limit= — oldest first, with hasMore for older pages.
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requireUser();
  return json(await listMessages(user, params.id, parseQuery(req, listMessagesQuery)));
});

// POST /api/v1/conversations/:id/messages — { body }. Also marks the thread read for the sender.
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requireUser();
  rateLimit(`send-message:${user.id}`, ...LIMITS.sendMessage);
  const { body } = await parseJson(req, sendMessageSchema);
  return json({ message: await sendMessage(user, params.id, body) }, { status: 201 });
});
