'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/app/dashboard/components/DashboardHeader';
import NextBookingCard from '@/app/dashboard/components/NextBookingCard';
import StatsRow from '@/app/dashboard/components/StatsRow';
import UpcomingBookings from '@/app/dashboard/components/UpcomingBookings';
import RecentMessages from '@/app/dashboard/components/RecentMessages';
import Toast from '@/app/components/ui/Toast';
import { bookings } from '@/app/data/mockData';

export default function DashboardClient() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  const handleBook = () => router.push('/book-service');

  // TODO: replace with GET /bookings?upcoming=true and GET /bookings/stats.
  // Mock dates are in the past, so "upcoming" is by status only for now.
  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'Confirmed' || b.status === 'Pending')
        .sort((a, b) => (a.isoDate < b.isoDate ? -1 : 1)),
    [],
  );
  const counts = useMemo(
    () => ({
      upcoming: upcoming.length,
      pending: bookings.filter((b) => b.status === 'Pending').length,
      completed: bookings.filter((b) => b.status === 'Completed').length,
      total: bookings.length,
    }),
    [upcoming],
  );

  const [next, ...later] = upcoming;

  return (
    <div className="space-y-6">
      <DashboardHeader name="John" upcomingCount={counts.upcoming} onBook={handleBook} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <NextBookingCard booking={next} onBook={handleBook} onNotify={setToast} />
        </div>
        <div className="xl:col-span-4">
          <StatsRow counts={counts} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingBookings bookings={later} />
        <RecentMessages onNotify={setToast} />
      </div>

      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
