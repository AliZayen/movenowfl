'use client';

import React from 'react';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';
import StatusBadge from '@/app/components/ui/StatusBadge';
import { bookings } from '@/app/data/mockData';

interface UpcomingBookingsProps {
  onViewAll: () => void;
  onNotify: (msg: string) => void;
}

export default function UpcomingBookings({ onViewAll, onNotify }: UpcomingBookingsProps) {
  const upcoming = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending');

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-foreground">Upcoming Bookings</h2>
        <button type="button" onClick={onViewAll} className="text-xs font-bold text-accent hover:underline">
          View All
        </button>
      </div>

      <ul className="mt-4 space-y-4">
        {upcoming.map((b) => (
          <li key={`upcoming-${b.id}`} className="rounded-xl border border-border p-3 transition-shadow hover:shadow-soft">
            <div className="flex gap-3">
              <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                <AppImage src={b.image} alt={b.imageAlt} fill sizes="112px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-bold text-foreground">{b.service}</h3>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="CalendarDaysIcon" size={14} />
                  <span className="tabular">
                    {b.dateLabel} • {b.timeWindow}
                  </span>
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="MapPinIcon" size={14} />
                  <span className="truncate">{b.address}</span>
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-muted/60 px-3 py-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Service Type</p>
                <p className="text-xs font-semibold text-foreground">{b.service}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Est. Duration</p>
                <p className="text-xs font-semibold text-foreground">{b.duration}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onNotify('You can modify or cancel from the booking details page')}
        className="mt-4 flex w-full items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-left transition-colors hover:bg-muted"
      >
        <Icon name="CalendarDaysIcon" size={22} className="text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-foreground">Need to make a change?</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            You can easily modify or cancel your booking before the scheduled time.
          </span>
        </span>
        <Icon name="ChevronRightIcon" size={16} className="text-muted-foreground" />
      </button>
    </section>
  );
}