'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BookingsHeader, { type DateRange } from '@/app/my-bookings/components/BookingsHeader';
import StatusTabs, { TabKey } from '@/app/my-bookings/components/StatusTabs';
import BookingCard from '@/app/my-bookings/components/BookingCard';
import Pagination from '@/app/my-bookings/components/Pagination';
import RightRail from '@/app/my-bookings/components/RightRail';
import EmptyState from '@/app/components/ui/EmptyState';
import Toast from '@/app/components/ui/Toast';
import { qs, useApi } from '@/app/lib/api/client';
import { API_STATUS, toUiBooking } from '@/app/lib/api/format';
import type { ApiBooking, ApiStats, Paginated } from '@/app/lib/api/types';

const PAGE_SIZE = 5;

interface MyBookingsClientProps {
  initialTab?: TabKey;
  initialQuery?: string;
  today: string; // YYYY-MM-DD, Florida time (from the server)
}

const shift = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Search, status, date range and pagination all run on the server (GET /bookings, /bookings/stats).
export default function MyBookingsClient({ initialTab = 'All', initialQuery = '', today }: MyBookingsClientProps) {
  const router = useRouter();
  const ranges = useMemo<DateRange[]>(
    () => [
      { id: 'all', label: 'All time' },
      { id: 'upcoming', label: 'Upcoming', from: today },
      { id: 'last30', label: 'Last 30 days', from: shift(today, -30), to: today },
      { id: 'last90', label: 'Last 90 days', from: shift(today, -90), to: today },
      { id: 'year', label: `This year`, from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` },
    ],
    [today],
  );

  const [query, setQuery] = useState(initialQuery);
  const [q, setQ] = useState(initialQuery.trim()); // debounced copy sent to the API
  const [rangeId, setRangeId] = useState('all');
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const t = setTimeout(() => setQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const range = ranges.find((r) => r.id === rangeId) ?? ranges[0];
  const filters = { q, from: range.from, to: range.to };

  const list = useApi<Paginated<ApiBooking>>(
    `/bookings${qs({ ...filters, status: tab === 'All' ? undefined : API_STATUS[tab], page, pageSize: PAGE_SIZE })}`,
  );
  const stats = useApi<ApiStats>(`/bookings/stats${qs(filters)}`);

  const counts: Record<TabKey, number> = {
    All: stats.data?.total ?? 0,
    Pending: stats.data?.pending ?? 0,
    Confirmed: stats.data?.confirmed ?? 0,
    Completed: stats.data?.completed ?? 0,
    Cancelled: stats.data?.cancelled ?? 0,
  };

  const items = (list.data?.items ?? []).map(toUiBooking);
  const total = list.data?.total ?? 0;
  const start = (page - 1) * PAGE_SIZE;

  const resetFilters = () => {
    setQuery('');
    setQ('');
    setTab('All');
    setRangeId('all');
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
          ranges={ranges}
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

        <div className="rounded-2xl border border-border bg-card shadow-soft" aria-busy={list.loading}>
          {list.error ? (
            <div className="p-5">
              <EmptyState title="Couldn't load your bookings" description={list.error.message} actionLabel="Try again" onAction={list.reload} />
            </div>
          ) : !list.data ? (
            <ul className="divide-y divide-border">
              {[0, 1, 2].map((i) => (
                <li key={i} className="h-32 animate-pulse bg-muted/30" />
              ))}
            </ul>
          ) : items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title={tab === 'All' && !q && rangeId === 'all' ? 'No bookings yet' : 'No matching bookings'}
                description="Nothing matches your current search, status or date range. Adjust your filters or book a new service."
                actionLabel="Reset filters"
                onAction={resetFilters}
              />
            </div>
          ) : (
            <ul className={`divide-y divide-border ${list.loading ? 'opacity-60' : ''}`}>
              {items.map((b) => (
                <li key={`card-${b.id}`}>
                  <BookingCard booking={b} onNotify={setToast} />
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={page}
            totalPages={list.data?.totalPages ?? 1}
            onPage={setPage}
            from={total === 0 ? 0 : start + 1}
            to={start + items.length}
            total={total}
          />
        </div>
      </div>

      <div className="xl:col-span-4">
        <RightRail onBook={() => router.push('/book-service')} />
      </div>
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
