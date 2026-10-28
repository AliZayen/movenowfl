'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroBanner from '@/app/dashboard/components/HeroBanner';
import StatsRow from '@/app/dashboard/components/StatsRow';
import UpcomingBookings from '@/app/dashboard/components/UpcomingBookings';
import RecentMessages from '@/app/dashboard/components/RecentMessages';
import BookingsSidePanel from '@/app/dashboard/components/BookingsSidePanel';
import QuickActionsGrid from '@/app/components/QuickActionsGrid';
import Toast from '@/app/components/ui/Toast';

export default function DashboardClient() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  const handleBook = () => router?.push('/book-service');

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-8">
        <HeroBanner onBook={handleBook} />
        <StatsRow onViewAll={() => router?.push('/my-bookings')} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UpcomingBookings onViewAll={() => router?.push('/my-bookings')} onNotify={setToast} />
          <RecentMessages onNotify={setToast} />
        </div>
      </div>
      <div className="space-y-6 xl:col-span-4">
        <BookingsSidePanel onNotify={setToast} />
        <QuickActionsGrid onBook={handleBook} />
      </div>
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}