import React, { Suspense } from 'react';
import { connection } from 'next/server';
import AppLayout from '@/app/components/AppLayout';
import MyBookingsClient from '@/app/my-bookings/components/MyBookingsClient';
import type { TabKey } from '@/app/my-bookings/components/StatusTabs';
import { todayInFlorida } from '@/app/lib/server/time';

type Props = PageProps<'/my-bookings'>;

const TABS: TabKey[] = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

// Reads ?status and ?q inside Suspense so the rest of the page can prerender.
async function Bookings({ searchParams }: Pick<Props, 'searchParams'>) {
  const { status, q } = await searchParams;
  await connection(); // reads today's date, so render per request
  const initialTab = TABS.find((t) => t === status) ?? 'All';
  const initialQuery = typeof q === 'string' ? q.slice(0, 100) : '';
  return (
    <MyBookingsClient
      key={`${initialTab}|${initialQuery}`}
      initialTab={initialTab}
      initialQuery={initialQuery}
      today={todayInFlorida()}
    />
  );
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
