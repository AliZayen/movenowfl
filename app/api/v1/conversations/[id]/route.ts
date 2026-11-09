import { requireUser } from '@/app/lib/server/auth';
import { handler, json, parseJson } from '@/app/lib/server/http';
import { getConversation, setConversationClosed } from '@/app/lib/server/messaging';
import { updateConversationSchema } from '@/app/lib/validation/messaging';

// GET /api/v1/conversations/:id — header info for a thread (other party, moderator, permissions, unread count).
export const GET = handler<{ id: string }>(async (_req, { params }) => {
  const { user } = await requireUser();
  return json({ conversation: await getConversation(user, params.id) });
});

// PATCH /api/v1/conversations/:id — { closed }. Moderator (the assigned pro) or support only:
// a closed conversation stops the customer from posting until it's reopened.
export const PATCH = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requireUser();
  const { closed } = await parseJson(req, updateConversationSchema);
  return json({ conversation: await setConversationClosed(user, params.id, closed) });
});
