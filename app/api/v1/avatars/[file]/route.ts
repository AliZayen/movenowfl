import { errors, handler } from '@/app/lib/server/http';
import { AVATAR_FILE_RE } from '@/app/lib/server/photos';
import { storage } from '@/app/lib/server/storage';

// GET /api/v1/avatars/:file — a profile picture. Public, but the address is random and changes
// with each upload, so it can be cached forever.
export const GET = handler<{ file: string }>(async (_req, { params }) => {
  if (!AVATAR_FILE_RE.test(params.file)) throw errors.notFound('Photo');
  const file = await storage().get(`avatars/${params.file}`);
  if (!file) throw errors.notFound('Photo');
  return new Response(new Uint8Array(file.body), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
});
