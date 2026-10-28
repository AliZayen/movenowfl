import React, { Suspense } from 'react';
import AppLayout from '@/app/components/AppLayout';
import MyBookingsClient from '@/app/my-bookings/components/MyBookingsClient';
import type { TabKey } from '@/app/my-bookings/components/StatusTabs';

type Props = PageProps<'/my-bookings'>;

const TABS: TabKey[] = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

// Reads ?status inside Suspense so the rest of the page can prerender.
async function Bookings({ searchParams }: Pick<Props, 'searchParams'>) {
  const { status } = await searchParams;
  const initialTab = TABS.find((t) => t === status) ?? 'All';
  return <MyBookingsClient key={initialTab} initialTab={initialTab} />;
}

export default function MyBookingsPage({ searchParams }: Props) {
  return (
    <AppLayout>
      <Suspense fallback={<p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>}>
        <Bookings searchParams={searchParams} />
      </Suspense>
    </AppLayout>
  );
}
