import { randomUUID } from 'node:crypto';
import { getBookingFor, type Viewer } from '@/app/lib/server/bookings';
import { db } from '@/app/lib/server/db';
import { errors, isUuid } from '@/app/lib/server/http';
import { processAvatar, processPhoto } from '@/app/lib/server/images';
import { OPEN_STATUSES } from '@/app/lib/server/lifecycle';
import { deleteQuietly, storage } from '@/app/lib/server/storage';
import { can } from '@/app/lib/staff';
import { MAX_PHOTOS_PER_BOOKING } from '@/app/lib/uploads';
import type { BookingPhoto, BookingStatus } from '@/generated/prisma/client';

// Booking photos and profile pictures.
//
// Booking photos are private: they're served by GET /bookings/:id/photos/:photoId, which uses the
// same access rule as the booking (owner, assigned provider, admin). The customer can add or remove
// photos while the booking is pending or confirmed; admins can until it's cancelled.
//
// Profile pictures are shown to the other side of conversations and bookings, so they're served
// publicly by GET /avatars/:file, at a random, unguessable address that changes with every upload.

const thumbKey = (key: string) => key.replace(/\.webp$/, '-thumb.webp');

export function photoUrl(bookingId: string, photoId: string, size: 'full' | 'thumb' = 'full') {
  return `/api/v1/bookings/${bookingId}/photos/${photoId}${size === 'thumb' ? '?size=thumb' : ''}`;
}

export function serializePhoto(p: BookingPhoto) {
  return {
    id: p.id,
    url: photoUrl(p.bookingId, p.id),
    thumbUrl: photoUrl(p.bookingId, p.id, 'thumb'),
    fileName: p.fileName,
    width: p.width,
    height: p.height,
    sizeBytes: p.sizeBytes,
    createdAt: p.createdAt.toISOString(),
  };
}

export function canEditPhotos(b: { status: BookingStatus; customerId: string }, viewer: Viewer) {
  if (viewer.role === 'admin') return can(viewer, 'bookings.manage') && b.status !== 'cancelled';
  return b.customerId === viewer.id && OPEN_STATUSES.includes(b.status);
}

export async function addBookingPhoto(viewer: Viewer, bookingIdOrRef: string, upload: { data: Buffer; name: string }) {
  const b = await getBookingFor(viewer, bookingIdOrRef);
  if (!canEditPhotos(b, viewer)) throw errors.conflict(`Photos can't be changed on a ${b.status.replace('_', ' ')} booking`);
  if (b.photos.length >= MAX_PHOTOS_PER_BOOKING) throw errors.conflict(`A booking can have up to ${MAX_PHOTOS_PER_BOOKING} photos`);

  const { full, thumb } = await processPhoto(upload.data);
  const key = `bookings/${b.id}/${randomUUID()}.webp`;
  await Promise.all([storage().put(key, full.body, 'image/webp'), storage().put(thumbKey(key), thumb.body, 'image/webp')]);
  try {
    // Re-count inside the transaction so two uploads at once can't pass the limit together.
    const photo = await db.$transaction(async (tx) => {
      if ((await tx.bookingPhoto.count({ where: { bookingId: b.id } })) >= MAX_PHOTOS_PER_BOOKING) {
        throw errors.conflict(`A booking can have up to ${MAX_PHOTOS_PER_BOOKING} photos`);
      }
      return tx.bookingPhoto.create({
        data: {
          bookingId: b.id,
          storageKey: key,
          fileName: upload.name,
          mimeType: 'image/webp',
          sizeBytes: full.sizeBytes,
          width: full.width,
          height: full.height,
          uploadedById: viewer.id,
        },
      });
    });
    return serializePhoto(photo);
  } catch (e) {
    await deleteQuietly(key, thumbKey(key));
    throw e;
  }
}

async function findPhoto(viewer: Viewer, bookingIdOrRef: string, photoId: string) {
  if (!isUuid(photoId)) throw errors.notFound('Photo');
  const b = await getBookingFor(viewer, bookingIdOrRef);
  const photo = b.photos.find((p) => p.id === photoId);
  if (!photo) throw errors.notFound('Photo');
  return { b, photo };
}

export async function deleteBookingPhoto(viewer: Viewer, bookingIdOrRef: string, photoId: string) {
  const { b, photo } = await findPhoto(viewer, bookingIdOrRef, photoId);
  if (!canEditPhotos(b, viewer)) throw errors.conflict(`Photos can't be changed on a ${b.status.replace('_', ' ')} booking`);
  await db.bookingPhoto.delete({ where: { id: photo.id } });
  await deleteQuietly(photo.storageKey, thumbKey(photo.storageKey));
}

export async function readBookingPhoto(viewer: Viewer, bookingIdOrRef: string, photoId: string, size: 'full' | 'thumb') {
  const { photo } = await findPhoto(viewer, bookingIdOrRef, photoId);
  const file = await storage().get(size === 'thumb' ? thumbKey(photo.storageKey) : photo.storageKey);
  if (!file) throw errors.notFound('Photo');
  return file;
}

// ─── Profile pictures ───────────────────────────────────────────────────────

const AVATAR_PREFIX = '/api/v1/avatars/';
export const AVATAR_FILE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

/** Storage key of an avatar we host, or null for outside URLs (e.g. seeded provider photos). */
export function avatarKey(avatarUrl: string | null | undefined) {
  if (!avatarUrl?.startsWith(AVATAR_PREFIX)) return null;
  const file = avatarUrl.slice(AVATAR_PREFIX.length);
  return AVATAR_FILE_RE.test(file) ? `avatars/${file}` : null;
}

export async function setAvatar(userId: string, previousUrl: string | null, data: Buffer) {
  const img = await processAvatar(data);
  const file = `${randomUUID()}.webp`;
  await storage().put(`avatars/${file}`, img.body, 'image/webp');
  try {
    const user = await db.user.update({ where: { id: userId }, data: { avatarUrl: `${AVATAR_PREFIX}${file}` }, include: { preferences: true } });
    await deleteQuietly(avatarKey(previousUrl));
    return user;
  } catch (e) {
    await deleteQuietly(`avatars/${file}`);
    throw e;
  }
}

export async function removeAvatar(userId: string, previousUrl: string | null) {
  const user = await db.user.update({ where: { id: userId }, data: { avatarUrl: null }, include: { preferences: true } });
  await deleteQuietly(avatarKey(previousUrl));
  return user;
}
