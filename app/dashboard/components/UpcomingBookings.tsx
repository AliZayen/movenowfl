'use client';

import React from 'react';
import Link from 'next/link';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';
import StatusBadge from '@/app/components/ui/StatusBadge';
import type { Booking } from '@/app/data/mockData';

interface UpcomingBookingsProps {
  // Bookings after the one shown in NextBookingCard.
  bookings: Booking[];
}

export default function UpcomingBookings({ bookings }: UpcomingBookingsProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-foreground">Later Bookings</h2>
        <Link href="/my-bookings" className="inline-flex min-h-8 items-center text-sm font-bold text-accent-strong hover:underline">
          View all
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
          No other bookings scheduled.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {bookings.map((b) => (
            <li key={`upcoming-${b.id}`}>
              <Link
                href={`/my-bookings/${b.id}`}
                className="flex gap-3 rounded-xl border border-border p-3 transition-shadow hover:shadow-soft"
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <AppImage src={b.image} alt={b.imageAlt} fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-bold text-foreground">{b.service}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon name="CalendarDaysIcon" size={14} />
                    <span className="tabular">
                      {b.dateLabel} · {b.timeWindow}
                    </span>
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon name="MapPinIcon" size={14} />
                    <span className="truncate">{b.address}</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
