import React, { Suspense } from 'react';
import AppLayout from '@/app/components/AppLayout';
import BookingDetailsClient from '@/app/my-bookings/[id]/components/BookingDetailsClient';

type Props = PageProps<'/my-bookings/[id]'>;

// Reads the [id] param inside Suspense so the layout around it can prerender.
async function Details({ params }: Pick<Props, 'params'>) {
  const { id } = await params;
  return <BookingDetailsClient bookingId={id} />;
}

export default function BookingDetailsPage({ params }: Props) {
  return (
    <AppLayout>
      <Suspense fallback={<p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>}>
        <Details params={params} />
      </Suspense>
    </AppLayout>
  );
}
