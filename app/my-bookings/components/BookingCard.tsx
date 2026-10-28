'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';
import StatusBadge from '@/app/components/ui/StatusBadge';
import Avatar from '@/app/components/ui/Avatar';
import { Booking } from '@/app/data/mockData';

interface BookingCardProps {
  booking: Booking;
  onNotify: (msg: string) => void;
}

export default function BookingCard({ booking: b, onNotify }: BookingCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closed = b.status === 'Completed' || b.status === 'Cancelled';

  return (
    <article className="relative flex flex-col gap-4 p-4 transition-colors hover:bg-muted/30 md:flex-row md:items-center">
      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-muted md:h-24 md:w-36">
        <AppImage src={b.image} alt={b.imageAlt} fill sizes="(max-width: 768px) 100vw, 144px" className="object-cover" />
      </div>

      <div className="min-w-0 md:w-[34%]">
        <h3 className="text-lg font-bold text-foreground">{b.service}</h3>
        <p className="tabular mt-0.5 text-xs text-muted-foreground">Ref: {b.ref}</p>
        <p className="tabular mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="CalendarDaysIcon" size={14} />
          {b.dateLabel} • {b.timeWindow}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="MapPinIcon" size={14} />
          <span className="truncate">{b.address}</span>
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 md:px-2">
        <div>
          <StatusBadge status={b.status} />
        </div>
        <div className="flex items-center gap-3">
          <Avatar src={b.provider.avatar} alt={b.provider.avatarAlt} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{b.provider.name}</p>
            <p className="tabular flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="StarIcon" size={13} variant="solid" className="text-accent" />
              {b.provider.rating.toFixed(1)} ({b.provider.reviews} reviews)
            </p>
          </div>
        </div>
      </div>

      <div ref={ref} className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-between md:self-stretch">
        <button
          type="button"
          aria-label={`More actions for ${b.ref}`}
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        >
          <Icon name="EllipsisVerticalIcon" size={20} />
        </button>
        <button
          type="button"
          onClick={() => router?.push(`/my-bookings/${b.id}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-bold text-primary transition-all duration-150 hover:border-accent hover:text-accent active:scale-95"
        >
          View Details <Icon name="ArrowRightIcon" size={14} />
        </button>

        {open && (
          <div className="absolute right-4 top-12 z-20 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-pop">
            <button
              type="button"
              disabled={closed}
              onClick={() => {
                setOpen(false);
                onNotify(`Reschedule request started for ${b.ref}`);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="CalendarDaysIcon" size={14} /> Reschedule
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNotify(`Message opened with ${b.provider.name}`);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-muted/60"
            >
              <Icon name="ChatBubbleOvalLeftEllipsisIcon" size={14} /> Message provider
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNotify(`Receipt for ${b.ref} sent to your email`);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-muted/60"
            >
              <Icon name="DocumentTextIcon" size={14} /> Email receipt
            </button>
            <button
              type="button"
              disabled={closed}
              onClick={() => {
                setOpen(false);
                onNotify(`Cancellation requested for ${b.ref}`);
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs text-destructive hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="XCircleIcon" size={14} /> Cancel booking
            </button>
          </div>
        )}
      </div>
    </article>
  );
}