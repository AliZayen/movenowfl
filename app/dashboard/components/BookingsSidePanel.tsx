'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';
import StatusBadge from '@/app/components/ui/StatusBadge';
import EmptyState from '@/app/components/ui/EmptyState';
import { bookings, BookingStatus, dateRanges } from '@/app/data/mockData';

interface BookingsSidePanelProps {
  onNotify: (msg: string) => void;
}

const serviceOptions = ['All Services', 'Moving', 'TV Mounting', 'Furniture Assembly'];
const statusOptions = ['All Statuses', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

export default function BookingsSidePanel({ onNotify }: BookingsSidePanelProps) {
  const [query, setQuery] = useState('');
  const [service, setService] = useState(serviceOptions[0]);
  const [status, setStatus] = useState(statusOptions[0]);
  const [rangeId, setRangeId] = useState(dateRanges[0].id);
  const [menuId, setMenuId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const range = dateRanges.find((r) => r.id === rangeId) ?? dateRanges[0];
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (service !== 'All Services' && b.service !== service) return false;
        if (status !== 'All Statuses' && b.status !== (status as BookingStatus)) return false;
        if (b.isoDate < range.from || b.isoDate > range.to) return false;
        if (q && !`${b.service} ${b.ref} ${b.address}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .slice(0, 4);
  }, [query, service, status, rangeId]);

  const selectClass =
    'h-10 w-full appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-xs font-semibold text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20';

  return (
    <section ref={wrapRef} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="text-xl font-extrabold text-foreground">My Bookings</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Manage and track all your service requests.</p>

      <label className="relative mt-4 block">
        <span className="sr-only">Search bookings</span>
        <Icon
          name="MagnifyingGlassIcon"
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by service, reference # or address..."
          className="h-10 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </label>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        <label className="relative block">
          <span className="sr-only">Service</span>
          <select value={service} onChange={(e) => setService(e.target.value)} className={selectClass}>
            {serviceOptions.map((o) => (
              <option key={`svc-${o}`} value={o}>
                {o}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDownIcon"
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            {statusOptions.map((o) => (
              <option key={`st-${o}`} value={o}>
                {o}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDownIcon"
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Date range</span>
          <select value={rangeId} onChange={(e) => setRangeId(e.target.value)} className={selectClass}>
            {dateRanges.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDownIcon"
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            title="No bookings match"
            description="Try clearing your filters or widening the date range to see more bookings."
            actionLabel="Clear filters"
            onAction={() => {
              setQuery('');
              setService(serviceOptions[0]);
              setStatus(statusOptions[0]);
              setRangeId(dateRanges[2].id);
            }}
          />
        ) : (
          filtered.map((b) => (
            <article
              key={`side-${b.id}`}
              className="relative rounded-xl border border-border p-3 transition-shadow hover:shadow-soft"
            >
              <div className="flex gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <AppImage src={b.image} alt={b.imageAlt} fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-bold text-foreground">{b.service}</h3>
                    <div className="flex items-center gap-1">
                      <StatusBadge status={b.status} />
                      <button
                        type="button"
                        aria-label={`More actions for ${b.ref}`}
                        onClick={() => setMenuId(menuId === b.id ? null : b.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                      >
                        <Icon name="EllipsisVerticalIcon" size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="tabular mt-1 text-[11px] text-muted-foreground">Ref: {b.ref}</p>
                  <p className="tabular mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Icon name="CalendarDaysIcon" size={12} />
                    {b.dateLabel} • {b.timeWindow}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Icon name="MapPinIcon" size={12} />
                    <span className="truncate">{b.address}</span>
                  </p>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <Link
                  href="/my-bookings"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold text-primary transition-all duration-150 hover:border-accent hover:text-accent active:scale-95"
                >
                  View Details <Icon name="ArrowRightIcon" size={12} />
                </Link>
              </div>
              {menuId === b.id && (
                <div className="absolute right-3 top-10 z-20 w-44 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-pop">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuId(null);
                      onNotify(`Reschedule request started for ${b.ref}`);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-muted/60"
                  >
                    <Icon name="CalendarDaysIcon" size={14} /> Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuId(null);
                      onNotify(`Message opened with ${b.provider.name}`);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-muted/60"
                  >
                    <Icon name="ChatBubbleOvalLeftEllipsisIcon" size={14} /> Message provider
                  </button>
                  <button
                    type="button"
                    disabled={b.status === 'Completed' || b.status === 'Cancelled'}
                    onClick={() => {
                      setMenuId(null);
                      onNotify(`Cancellation requested for ${b.ref}`);
                    }}
                    className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs text-destructive hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon name="XCircleIcon" size={14} /> Cancel booking
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}