import type { NextRequest } from 'next/server';
import { requireUser } from '@/app/lib/server/auth';
import { handler } from '@/app/lib/server/http';
import { deleteBookingPhoto, readBookingPhoto } from '@/app/lib/server/photos';

// GET /api/v1/bookings/:id/photos/:photoId?size=thumb — the image itself, for people who can see
// the booking (404 for everyone else). Cached only by the viewer's own browser.
export const GET = handler<{ id: string; photoId: string }>(async (req: NextRequest, { params }) => {
  const { user } = await requireUser();
  const size = req.nextUrl.searchParams.get('size') === 'thumb' ? 'thumb' : 'full';
  const file = await readBookingPhoto(user, params.id, params.photoId, size);
  return new Response(new Uint8Array(file.body), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
});

// DELETE /api/v1/bookings/:id/photos/:photoId — while the booking can still be changed.
export const DELETE = handler<{ id: string; photoId: string }>(async (_req, { params }) => {
  const { user } = await requireUser();
  await deleteBookingPhoto(user, params.id, params.photoId);
  return new Response(null, { status: 204 });
});
