import { requireUser } from '@/app/lib/server/auth';
import { handler, json, parseJson, parseQuery } from '@/app/lib/server/http';
import { listConversations, startConversation } from '@/app/lib/server/messaging';
import { listConversationsQuery, startConversationSchema } from '@/app/lib/validation/messaging';

// GET /api/v1/conversations?limit= — conversations with messages, newest activity first, with unread counts.
export const GET = handler(async (req) => {
  const { user } = await requireUser();
  return json(await listConversations(user, parseQuery(req, listConversationsQuery)));
});

// POST /api/v1/conversations — { bookingId } (UUID or ref). Gets or creates the booking's conversation.
export const POST = handler(async (req) => {
  const { user } = await requireUser();
  const { bookingId } = await parseJson(req, startConversationSchema);
  const { conversation, created } = await startConversation(user, bookingId);
  return json({ conversation }, { status: created ? 201 : 200 });
});
