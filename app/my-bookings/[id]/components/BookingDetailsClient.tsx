'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';
import AppImage from '@/app/components/ui/AppImage';
import Avatar from '@/app/components/ui/Avatar';
import StatusBadge from '@/app/components/ui/StatusBadge';
import Toast from '@/app/components/ui/Toast';
import EmptyState from '@/app/components/ui/EmptyState';
import { bookings, BookingStatus, ServiceType } from '@/app/data/mockData';
import DetailsTabs from '@/app/my-bookings/[id]/components/DetailsTabs';
import BookingProgress from '@/app/my-bookings/[id]/components/BookingProgress';
import DetailsSidebar from '@/app/my-bookings/[id]/components/DetailsSidebar';

interface BookingDetailsClientProps {
  bookingId: string;
}

const serviceIcon: Record<ServiceType, string> = {
  'Moving': 'TruckIcon',
  'TV Mounting': 'TvIcon',
  'Furniture Assembly': 'WrenchScrewdriverIcon',
};

export default function BookingDetailsClient({ bookingId }: BookingDetailsClientProps) {
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  // TODO: replace with GET /bookings/:id
  const booking = bookings.find((b) => b.id === bookingId || b.ref === bookingId);
  const [status, setStatus] = useState<BookingStatus | null>(null);

  if (!booking) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          icon="CalendarDaysIcon"
          title="Booking not found"
          description="We couldn't find that booking. Head back to your bookings to pick another one."
        />
      </div>
    );
  }

  const b = booking;
  const current: BookingStatus = status ?? b.status;

  const cancel = () => {
    setStatus('Cancelled');
    setToast(`Booking ${b.ref} was cancelled`);
  };

  return (
    <div className="space-y-6">
      <BackLink />

      {/* On phones: summary, then Manage booking, then progress and tabs. On desktop the sidebar sits on the right. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <section aria-labelledby="booking-title" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-strong">
                <Icon name={serviceIcon[b.service]} size={26} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 id="booking-title" className="text-2xl font-extrabold text-primary">
                    {b.service}
                  </h1>
                  <StatusBadge status={current} />
                </div>
                <p className="tabular mt-1 text-sm text-muted-foreground">Ref: {b.ref}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-[1fr_1fr]">
              <div className="relative h-56 overflow-hidden rounded-xl bg-muted md:h-full md:min-h-64">
                <AppImage src={b.image} alt={b.imageAlt} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
              </div>

              <dl className="space-y-4 rounded-xl border border-border bg-secondary/40 p-4">
                <InfoRow icon="CalendarDaysIcon" label="Date" value={b.dateLabel} />
                <InfoRow icon="ClockIcon" label="Arrival window" value={`${b.timeWindow} · about ${b.duration}`} />
                <InfoRow icon="MapPinIcon" label="Service address" value={b.address} />
                <div className="flex gap-3">
                  <Icon name="UserIcon" size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Your pro</dt>
                    <dd className="mt-1 flex items-center gap-2">
                      <Avatar src={b.provider.avatar} alt={b.provider.avatarAlt} size={36} />
                      <span>
                        <span className="block text-sm font-bold text-foreground">{b.provider.name}</span>
                        <span className="tabular flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon name="StarIcon" size={12} variant="solid" className="text-warning" />
                          {b.provider.rating.toFixed(1)} ({b.provider.reviews} reviews)
                        </span>
                      </span>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </section>
        </div>

        <aside className="xl:col-span-4 xl:col-start-9 xl:row-span-2 xl:row-start-1">
          <DetailsSidebar booking={b} status={current} onCancel={cancel} onNotify={setToast} />
        </aside>

        <div className="min-w-0 space-y-6 xl:col-span-8">
          <BookingProgress status={current} booking={b} />
          <DetailsTabs booking={b} status={current} onNotify={setToast} />
        </div>
      </div>
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/my-bookings" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:text-accent-strong">
      <Icon name="ArrowLeftIcon" size={16} /> Back to My Bookings
    </Link>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex gap-3">
      <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-primary" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="tabular text-sm font-semibold text-foreground">{value}</dd>
      </div>
    </div>
  );
}
