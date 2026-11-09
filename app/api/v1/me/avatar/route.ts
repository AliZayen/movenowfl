import { requireUser, serializeUser } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';
import { readUpload } from '@/app/lib/server/images';
import { removeAvatar, setAvatar } from '@/app/lib/server/photos';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';

// POST /api/v1/me/avatar — multipart/form-data with one image in "file" (max 10 MB). Stored as a
// 512×512 WebP; the old picture is deleted. Returns the updated user.
export const POST = handler(async (req) => {
  const { user } = await requireUser();
  rateLimit(`upload:${user.id}`, ...LIMITS.upload);
  const { data } = await readUpload(req);
  return json({ user: serializeUser(await setAvatar(user.id, user.avatarUrl, data)) });
});

// DELETE /api/v1/me/avatar — back to initials.
export const DELETE = handler(async () => {
  const { user } = await requireUser();
  return json({ user: serializeUser(await removeAvatar(user.id, user.avatarUrl)) });
});
