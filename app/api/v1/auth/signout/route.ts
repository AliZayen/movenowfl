import { destroySession } from '@/app/lib/server/auth';
import { handler } from '@/app/lib/server/http';

// POST /api/v1/auth/signout
export const POST = handler(async () => {
  await destroySession();
  return new Response(null, { status: 204 });
});
