'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookingRows } from '@/app/admin/components/BookingRows';
import { Card, ErrorBox, inputCls, Loading, PageHeader, Pager } from '@/app/admin/components/ui';
import { qs, useApi } from '@/app/lib/api/client';
import type { AdminBookingList } from '@/app/lib/api/types';
import { BOOKING_STATUSES, SERVICE_LABELS, SERVICE_TYPES } from '@/app/lib/catalog';
import { UI_STATUS } from '@/app/lib/api/format';

const SORTS = [
  { id: 'created_desc', label: 'Newest requests' },
  { id: 'created_asc', label: 'Oldest requests' },
  { id: 'scheduled_asc', label: 'Service date (soonest)' },
  { id: 'scheduled_desc', label: 'Service date (latest)' },
];

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Bookings />
    </Suspense>
  );
}

// Filters live in the URL, so a filtered list can be bookmarked or shared with another dispatcher.
function Bookings() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = (k: string) => params.get(k) ?? '';
  const [q, setQ] = useState(get('q'));

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Search as you type, after a short pause.
  useEffect(() => {
    if (q === get('q')) return;
    const t = setTimeout(() => set({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text should restart the timer
  }, [q]);

  const query = qs({
    q: get('q'),
    status: get('status'),
    service: get('service'),
    from: get('from'),
    to: get('to'),
    unassigned: get('unassigned'),
    sort: get('sort') || 'created_desc',
    page: get('page') || 1,
    pageSize: 20,
  });
  const { data, error, reload, loading } = useApi<AdminBookingList>(`/admin/bookings${query}`);
  const filtered = ['q', 'status', 'service', 'from', 'to', 'unassigned'].some((k) => params.get(k));

  return (
    <>
      <PageHeader title="Bookings" subtitle="Every booking. Open one to confirm it, assign a pro, or change its status." />

      <Card className="mb-4">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="lg:col-span-2">
            <span className="sr-only">Search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ref, customer, email, street, ZIP or pro" className={inputCls} />
          </label>
          <label>
            <span className="sr-only">Status</span>
            <select value={get('status')} onChange={(e) => set({ status: e.target.value })} className={inputCls}>
              <option value="">All statuses</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {UI_STATUS[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Service</span>
            <select value={get('service')} onChange={(e) => set({ service: e.target.value })} className={inputCls}>
              <option value="">All services</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort</span>
            <select value={get('sort') || 'created_desc'} onChange={(e) => set({ sort: e.target.value })} className={inputCls}>
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-10 items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={get('unassigned') === 'true'} onChange={(e) => set({ unassigned: e.target.checked ? 'true' : '' })} className="h-4 w-4 accent-[var(--accent-strong)]" />
            No provider yet
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground lg:col-span-3">
            Service date from
            <input type="date" value={get('from')} onChange={(e) => set({ from: e.target.value })} className={`${inputCls} w-auto`} />
            to
            <input type="date" value={get('to')} onChange={(e) => set({ to: e.target.value })} className={`${inputCls} w-auto`} />
          </label>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                router.replace(pathname);
              }}
              className="h-10 text-left text-sm font-bold text-accent-strong hover:underline lg:col-span-3 lg:text-right"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {error && <ErrorBox message={error.message} onRetry={reload} />}
      <Card>
        <div aria-busy={loading || undefined} className={loading && data ? 'opacity-60' : undefined}>
          {!data ? <Loading rows={6} /> : <BookingRows items={data.items} empty={filtered ? 'No bookings match these filters.' : 'No bookings yet.'} />}
        </div>
        {data && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => set({ page: String(p) })} />}
      </Card>
    </>
  );
}
