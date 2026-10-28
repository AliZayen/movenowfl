import React from 'react';
import AppLayout from '@/app/components/AppLayout';
import BookFAServiceClient from '@/app/book-service/furniture-assembly/components/BookFAServiceClient';

export default function MovingPage() {
  return (
    <AppLayout>
      <BookFAServiceClient />
    </AppLayout>
  );
}
