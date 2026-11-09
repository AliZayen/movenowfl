'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorMessage, upload } from '@/app/lib/api/client';
import type { ApiBookingDetail } from '@/app/lib/api/types';

/**
 * POST /bookings, then upload the chosen photos to it, then open the new booking.
 * Photos go up one at a time after the booking exists; if some fail, the booking page says so
 * and the customer can add them from its Photos tab.
 */
export function useSubmitBooking(onError: (message: string) => void) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [progress, setProgress] = useState<string | null>(null);

  const submit = async (payload: object) => {
    setBusy(true);
    let booking: ApiBookingDetail;
    try {
      ({ booking } = await api<{ booking: ApiBookingDetail }>('/bookings', { method: 'POST', body: payload }));
    } catch (e) {
      onError(errorMessage(e));
      setBusy(false);
      return;
    }
    const failed = await uploadBookingPhotos(booking.id, photos, (done, total) => setProgress(`Uploading photos ${done}/${total}…`));
    router.push(`/my-bookings/${booking.id}?created=1${failed ? `&photosFailed=${failed}` : ''}`);
  };

  return { submit, busy, progress, photos, setPhotos };
}

/** Uploads each photo; returns how many failed. */
export async function uploadBookingPhotos(bookingId: string, files: File[], onProgress?: (done: number, total: number) => void) {
  let failed = 0;
  for (const [i, file] of files.entries()) {
    onProgress?.(i + 1, files.length);
    try {
      await upload(`/bookings/${bookingId}/photos`, file);
    } catch {
      failed += 1;
    }
  }
  return failed;
}
