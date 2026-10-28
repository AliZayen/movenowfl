import React from 'react';
import AppLayout from '@/app/components/AppLayout';
import MyBookingsClient from '@/app/my-bookings/components/MyBookingsClient';

export default function MyBookingsPage() {
  return (
    <AppLayout>
      <MyBookingsClient />
    </AppLayout>
  );
}