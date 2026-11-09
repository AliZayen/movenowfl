'use client';

import React, { useRef, useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';
import { uploadBookingPhotos } from '@/app/book-service/components/useSubmitBooking';
import { api, errorMessage } from '@/app/lib/api/client';
import type { ApiBookingDetail } from '@/app/lib/api/types';
import { ACCEPTED_IMAGE_TYPES, checkImageFile, MAX_PHOTOS_PER_BOOKING } from '@/app/lib/uploads';

interface BookingPhotosProps {
  booking: ApiBookingDetail;
  onUpdated: (booking: ApiBookingDetail, message: string) => void;
  onNotify: (msg: string) => void;
}

// Photos tab on the booking page. Images load from the API, which checks the viewer can see the booking.
export default function BookingPhotos({ booking: b, onUpdated, onNotify }: BookingPhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const canEdit = b.permissions.canEditPhotos;
  const room = MAX_PHOTOS_PER_BOOKING - b.photos.length;

  const reload = async (message: string) => {
    const { booking } = await api<{ booking: ApiBookingDetail }>(`/bookings/${b.id}`);
    onUpdated(booking, message);
  };

  const add = async (list: FileList | null) => {
    // Copy the files before clearing the picker (clearing empties the same list).
    const picked = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (!picked.length) return;
    const files = picked.filter((f) => {
      const problem = checkImageFile(f);
      if (problem) onNotify(problem);
      return !problem;
    });
    if (files.length > room) onNotify(`Up to ${MAX_PHOTOS_PER_BOOKING} photos per booking`);
    const batch = files.slice(0, room);
    if (!batch.length) return;
    const failed = await uploadBookingPhotos(b.id, batch, (done, total) => setProgress(`Uploading ${done}/${total}…`));
    setProgress(null);
    const added = batch.length - failed;
    try {
      await reload(
        failed
          ? `${added} photo${added === 1 ? '' : 's'} added, ${failed} couldn't be uploaded. Try those again.`
          : `${added} photo${added === 1 ? '' : 's'} added`,
      );
    } catch (e) {
      onNotify(errorMessage(e));
    }
  };

  const remove = async (photoId: string) => {
    setDeleting(photoId);
    try {
      await api(`/bookings/${b.id}/photos/${photoId}`, { method: 'DELETE' });
      await reload('Photo removed');
    } catch (e) {
      onNotify(errorMessage(e));
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  return (
    <div id="panel-photos" role="tabpanel" aria-labelledby="tab-photos" className="space-y-3">
      {b.photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {b.photos.map((p) => (
            <li key={p.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
              <a href={p.url} target="_blank" rel="noopener" aria-label={`Open ${p.fileName} full size`} className="block h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- private image served by the API with the viewer's cookie */}
                <img src={p.thumbUrl} alt={p.fileName} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </a>
              {canEdit &&
                (confirmId === p.id ? (
                  <span className="absolute inset-x-1 bottom-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      disabled={deleting === p.id}
                      className="flex-1 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground disabled:opacity-60"
                    >
                      {deleting === p.id ? 'Removing…' : 'Remove'}
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className="rounded-md bg-card px-2 py-1 text-xs font-bold text-foreground">
                      Keep
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Remove ${p.fileName}`}
                    onClick={() => setConfirmId(p.id)}
                    className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive"
                  >
                    <Icon name="TrashIcon" size={15} />
                  </button>
                ))}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {canEdit ? 'No photos yet. Photos of large or tricky items help your pro come prepared.' : 'No photos were added to this booking.'}
        </p>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES} multiple className="hidden" onChange={(e) => add(e.target.files)} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!!progress || room <= 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-bold text-primary hover:border-accent-strong hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="CameraIcon" size={18} /> {progress ?? 'Add photos'}
          </button>
          <span className="text-xs text-muted-foreground">
            {room > 0 ? `${b.photos.length}/${MAX_PHOTOS_PER_BOOKING} · JPG, PNG or WebP, up to 10 MB each` : `Photo limit reached (${MAX_PHOTOS_PER_BOOKING})`}
          </span>
        </div>
      )}
    </div>
  );
}
