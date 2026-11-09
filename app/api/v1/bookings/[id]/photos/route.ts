import { requireUser } from '@/app/lib/server/auth';
import { handler, json } from '@/app/lib/server/http';
import { readUpload } from '@/app/lib/server/images';
import { addBookingPhoto } from '@/app/lib/server/photos';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';

// POST /api/v1/bookings/:id/photos — multipart/form-data with one image in "file" (max 10 MB).
// The image is checked, stripped of metadata and stored as WebP. Up to 10 photos per booking.
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const { user } = await requireUser();
  rateLimit(`upload:${user.id}`, ...LIMITS.upload);
  const upload = await readUpload(req);
  return json({ photo: await addBookingPhoto(user, params.id, upload) }, { status: 201 });
});
