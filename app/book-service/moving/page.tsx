import React from 'react';
import AppLayout from '@/app/components/AppLayout';
import BookMovingServiceClient from '@/app/book-service/moving/components/BookMovingServiceClient';

export default function MovingPage() {
  return (
    <AppLayout>
      <BookMovingServiceClient />
    </AppLayout>
  );
}
