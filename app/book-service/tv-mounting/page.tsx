import React from 'react';
import AppLayout from '@/app/components/AppLayout';
import BookTVMServiceClient from '@/app/book-service/tv-mounting/components/BookTVMServiceClient';

export default function MovingPage() {
  return (
    <AppLayout>
      <BookTVMServiceClient />
    </AppLayout>
  );
}
