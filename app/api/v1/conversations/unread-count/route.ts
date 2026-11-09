import { requireUser } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';
import { unreadCount } from '@/app/lib/server/messaging';

// GET /api/v1/conversations/unread-count — { count } for the nav "Messages" badge.
export const GET = handler(async () => {
  const { user } = await requireUser();
  return json(await unreadCount(user));
});
