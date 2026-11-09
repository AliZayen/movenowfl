'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/app/dashboard/components/DashboardHeader';
import NextBookingCard from '@/app/dashboard/components/NextBookingCard';
import StatsRow from '@/app/dashboard/components/StatsRow';
import UpcomingBookings from '@/app/dashboard/components/UpcomingBookings';
import RecentMessages from '@/app/dashboard/components/RecentMessages';
import Toast from '@/app/components/ui/Toast';
import { useSession } from '@/app/components/SessionProvider';
import { useApi } from '@/app/lib/api/client';
import { toUiBooking } from '@/app/lib/api/format';
import type { ApiBooking, ApiStats, Paginated } from '@/app/lib/api/types';

export default function DashboardClient() {
  const router = useRouter();
  const { user } = useSession();
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  // Pending/confirmed/in-progress bookings from today on, soonest first.
  const upcoming = useApi<Paginated<ApiBooking>>('/bookings?upcoming=true&pageSize=4');
  const stats = useApi<ApiStats>('/bookings/stats');

  const handleBook = () => router.push('/book-service');
  const items = (upcoming.data?.items ?? []).map(toUiBooking);
  const [next, ...later] = items;
  const firstName = user?.fullName.split(' ')[0] || 'there';
  const error = upcoming.error ?? stats.error;

  return (
    <div className="space-y-6">
      <DashboardHeader name={firstName} upcomingCount={stats.data?.upcoming ?? null} onBook={handleBook} />

      {error && (
        <p role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error.message}
          <button
            type="button"
            onClick={() => {
              upcoming.reload();
              stats.reload();
            }}
            className="font-bold underline"
          >
            Try again
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <NextBookingCard booking={next} loading={upcoming.loading && !upcoming.data} onBook={handleBook} onNotify={setToast} />
        </div>
        <div className="xl:col-span-4">
          <StatsRow
            counts={{
              upcoming: stats.data?.upcoming ?? 0,
              pending: stats.data?.pending ?? 0,
              completed: stats.data?.completed ?? 0,
              total: stats.data?.total ?? 0,
            }}
            loading={!stats.data}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingBookings bookings={later} loading={upcoming.loading && !upcoming.data} />
        <RecentMessages />
      </div>

      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
