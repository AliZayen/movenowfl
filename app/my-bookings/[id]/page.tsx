import React, { Suspense } from 'react';
import AppLayout from '@/app/components/AppLayout';
import BookingDetailsClient from '@/app/my-bookings/[id]/components/BookingDetailsClient';

interface BookingDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { id } = await params;
  return (
    <AppLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <BookingDetailsClient bookingId={id} />
      </Suspense>
    </AppLayout>
  );
}
