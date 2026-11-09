import { requireUser } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';
import { hideMessage } from '@/app/lib/server/messaging';

// DELETE /api/v1/conversations/:id/messages/:messageId — hides the message's text from everyone.
// Moderator (not support's messages) or support only. The row is kept for disputes.
export const DELETE = handler<{ id: string; messageId: string }>(async (_req, { params }) => {
  const { user } = await requireUser();
  return json({ message: await hideMessage(user, params.id, params.messageId) });
});
