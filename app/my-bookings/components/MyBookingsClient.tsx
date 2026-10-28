'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BookingsHeader from '@/app/my-bookings/components/BookingsHeader';
import StatusTabs, { TabKey } from '@/app/my-bookings/components/StatusTabs';
import BookingCard from '@/app/my-bookings/components/BookingCard';
import Pagination from '@/app/my-bookings/components/Pagination';
import RightRail from '@/app/my-bookings/components/RightRail';
import EmptyState from '@/app/components/ui/EmptyState';
import Toast from '@/app/components/ui/Toast';
import { bookings, dateRanges, type Booking } from '@/app/data/mockData';

const PAGE_SIZE = 5;

// Open bookings (pending/confirmed) first, soonest first; then past ones, newest first.
const isOpen = (b: Booking) => b.status === 'Pending' || b.status === 'Confirmed';
const byUpcomingFirst = (a: Booking, b: Booking) => {
  if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
  return isOpen(a) ? a.isoDate.localeCompare(b.isoDate) : b.isoDate.localeCompare(a.isoDate);
};

interface MyBookingsClientProps {
  initialTab?: TabKey;
}

export default function MyBookingsClient({ initialTab = 'All' }: MyBookingsClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [rangeId, setRangeId] = useState(dateRanges?.[2]?.id);
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  const rangeFiltered = useMemo(() => {
    const range = dateRanges?.find((r) => r?.id === rangeId) ?? dateRanges?.[2];
    const q = query?.trim()?.toLowerCase();
    return bookings?.filter((b) => b?.isoDate >= range?.from && b?.isoDate <= range?.to)?.filter((b) => !q || `${b?.service} ${b?.ref} ${b?.address} ${b?.provider?.name}`?.toLowerCase()?.includes(q))?.sort(byUpcomingFirst);
  }, [query, rangeId]);

  const counts = useMemo(
    () => ({
      All: rangeFiltered?.length,
      Pending: rangeFiltered?.filter((b) => b?.status === 'Pending')?.length,
      Confirmed: rangeFiltered?.filter((b) => b?.status === 'Confirmed')?.length,
      Completed: rangeFiltered?.filter((b) => b?.status === 'Completed')?.length,
      Cancelled: rangeFiltered?.filter((b) => b?.status === 'Cancelled')?.length,
    }),
    [rangeFiltered],
  );

  const visible = useMemo(
    () => (tab === 'All' ? rangeFiltered : rangeFiltered?.filter((b) => b?.status === tab)),
    [rangeFiltered, tab],
  );

  const totalPages = Math.max(1, Math.ceil(visible?.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = visible?.slice(start, start + PAGE_SIZE);

  const resetFilters = () => {
    setQuery('');
    setTab('All');
    setRangeId(dateRanges?.[2]?.id);
    setPage(1);
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-5 xl:col-span-8 2xl:col-span-8">
        <BookingsHeader
          query={query}
          onQuery={(v) => {
            setQuery(v);
            setPage(1);
          }}
          rangeId={rangeId}
          onRange={(v) => {
            setRangeId(v);
            setPage(1);
          }}
        />
        <StatusTabs
          active={tab}
          counts={counts}
          onChange={(t) => {
            setTab(t);
            setPage(1);
          }}
        />

        <div className="rounded-2xl border border-border bg-card shadow-soft">
          {pageItems?.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title={tab === 'All' ? 'No bookings yet' : `No ${tab?.toLowerCase()} bookings`}
                description="Nothing matches your current search, status or date range. Adjust your filters or book a new service."
                actionLabel="Reset filters"
                onAction={resetFilters}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {pageItems?.map((b) => (
                <li key={`card-${b?.id}`}>
                  <BookingCard booking={b} onNotify={setToast} />
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPage={setPage}
            from={visible?.length === 0 ? 0 : start + 1}
            to={start + pageItems?.length}
            total={visible?.length}
          />
        </div>
      </div>

      <div className="xl:col-span-4">
        <RightRail onBook={() => router.push('/book-service')} onNotify={setToast} />
      </div>
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}