import React from 'react';
import AppLayout from '@/app/components/AppLayout';
import ChooseService from '@/app/book-service/components/ChooseService';

export default function BookServicePage() {
  return (
    <AppLayout>
      <ChooseService />
    </AppLayout>
  );
}
