'use client';

import React from 'react';
import Link from 'next/link';
import AppImage from '@/app/components/ui/AppImage';
import Avatar from '@/app/components/ui/Avatar';
import Icon from '@/app/components/ui/AppIcon';
import StatusBadge from '@/app/components/ui/StatusBadge';
import type { Booking } from '@/app/data/mockData';

interface NextBookingCardProps {
  booking: Booking | undefined;
  onBook: () => void;
  onNotify: (msg: string) => void;
}

// The most useful thing for a returning customer: when the next job is and who is coming.
export default function NextBookingCard({ booking, onBook, onNotify }: NextBookingCardProps) {
  if (!booking) {
    return (
      <section
        id="upcoming"
        className="flex h-full flex-col items-start justify-center rounded-2xl border border-border bg-card p-6 shadow-soft"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-accent-strong">Next booking</p>
        <h2 className="mt-2 text-xl font-extrabold text-foreground">Nothing scheduled yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Book a move, furniture assembly, or TV mounting in a few clicks.</p>
        <button
          type="button"
          onClick={onBook}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-strong px-5 py-3 text-sm font-bold text-accent-foreground shadow-soft transition-opacity hover:opacity-90"
        >
          Book a Service <Icon name="ArrowRightIcon" size={16} />
        </button>
      </section>
    );
  }

  const b = booking;
  return (
    <section
      id="upcoming"
      aria-labelledby="next-booking-title"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-40 w-full shrink-0 bg-muted sm:h-auto sm:w-56">
          <AppImage src={b.image} alt={b.imageAlt} fill sizes="(max-width: 640px) 100vw, 224px" className="object-cover" />
        </div>

        <div className="min-w-0 flex-1 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-strong">Next booking</p>
              <h2 id="next-booking-title" className="mt-1 text-xl font-extrabold text-foreground">
                {b.service}
              </h2>
            </div>
            <StatusBadge status={b.status} />
          </div>

          <p className="tabular mt-3 flex items-center gap-2 text-base font-bold text-foreground">
            <Icon name="CalendarDaysIcon" size={18} className="text-primary" />
            {b.dateLabel} · {b.timeWindow}
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="MapPinIcon" size={16} />
            <span className="truncate">{b.address}</span>
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/60 p-3">
            <Avatar src={b.provider.avatar} alt={b.provider.avatarAlt} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{b.provider.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon name="StarIcon" size={12} variant="solid" className="text-warning" />
                {b.provider.rating.toFixed(1)} ({b.provider.reviews} reviews) · {b.duration}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/my-bookings/${b.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              View details <Icon name="ArrowRightIcon" size={16} />
            </Link>
            <button
              type="button"
              onClick={() => onNotify(`Message opened with ${b.provider.name}`)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Icon name="ChatBubbleOvalLeftEllipsisIcon" size={18} /> Message
            </button>
            <Link
              href={`/my-bookings/${b.id}`}
              className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-accent-strong hover:underline"
            >
              Reschedule or cancel
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
