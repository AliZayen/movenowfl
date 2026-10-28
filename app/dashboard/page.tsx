import React from 'react';
import AppLayout from '@/app/components/AppLayout';
import ProfileClient from '@/app/dashboard/components/DashboardClient';

export default function ProfilePage() {
  return (
    <AppLayout>
      <ProfileClient />
    </AppLayout>
  );
}
