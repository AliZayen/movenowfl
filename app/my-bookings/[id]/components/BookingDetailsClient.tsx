'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Icon from '@/app/components/ui/AppIcon';
import AppImage from '@/app/components/ui/AppImage';
import Avatar from '@/app/components/ui/Avatar';
import StatusBadge from '@/app/components/ui/StatusBadge';
import Toast from '@/app/components/ui/Toast';
import EmptyState from '@/app/components/ui/EmptyState';
import { useApi } from '@/app/lib/api/client';
import { durationLabel, formatDate, formatDateTime, UI_STATUS, windowLabel } from '@/app/lib/api/format';
import type { ApiBookingDetail } from '@/app/lib/api/types';
import { SERVICE_LABELS, type ServiceTypeId } from '@/app/lib/catalog';
import DetailsTabs from '@/app/my-bookings/[id]/components/DetailsTabs';
import BookingProgress from '@/app/my-bookings/[id]/components/BookingProgress';
import DetailsSidebar from '@/app/my-bookings/[id]/components/DetailsSidebar';

interface BookingDetailsClientProps {
  bookingId: string;
}

const serviceIcon: Record<ServiceTypeId, string> = {
  moving: 'TruckIcon',
  tv_mounting: 'TvIcon',
  furniture_assembly: 'WrenchScrewdriverIcon',
};

export default function BookingDetailsClient({ bookingId }: BookingDetailsClientProps) {
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const search = useSearchParams();
  const justCreated = search.get('created') === '1';
  const photosFailed = Number(search.get('photosFailed') ?? 0);
  const { data, error, mutate, reload } = useApi<{ booking: ApiBookingDetail }>(`/bookings/${encodeURIComponent(bookingId)}`);

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          icon="CalendarDaysIcon"
          title={error.status === 404 ? 'Booking not found' : "Couldn't load this booking"}
          description={error.status === 404 ? "We couldn't find that booking. Head back to your bookings to pick another one." : error.message}
          actionLabel={error.status === 404 ? undefined : 'Try again'}
          onAction={error.status === 404 ? undefined : reload}
        />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <BackLink />
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  const b = data.booking;
  const update = (booking: ApiBookingDetail, message: string) => {
    mutate({ booking });
    setToast(message);
  };

  return (
    <div className="space-y-6">
      <BackLink />

      {justCreated && b.status === 'pending' && (
        <p role="status" className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground">
          <Icon name="CheckCircleIcon" size={20} variant="solid" className="shrink-0 text-success" />
          <span>
            <strong>Request sent.</strong> We&apos;ll match you with a pro and confirm your arrival window. You can follow it here.
          </span>
        </p>
      )}
      {justCreated && photosFailed > 0 && (
        <p role="alert" className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <Icon name="ExclamationTriangleIcon" size={20} className="shrink-0 text-warning" />
          <span>
            {photosFailed} photo{photosFailed === 1 ? '' : 's'} couldn&apos;t be uploaded. You can add {photosFailed === 1 ? 'it' : 'them'} again from the Photos tab below.
          </span>
        </p>
      )}

      {/* On phones: summary, then Manage booking, then progress and tabs. On desktop the sidebar sits on the right. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <section aria-labelledby="booking-title" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-strong">
                <Icon name={serviceIcon[b.serviceType]} size={26} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 id="booking-title" className="text-2xl font-extrabold text-primary">
                    {SERVICE_LABELS[b.serviceType]}
                  </h1>
                  <StatusBadge status={UI_STATUS[b.status]} />
                </div>
                <p className="tabular mt-1 text-sm text-muted-foreground">
                  Ref: {b.ref} · Requested {formatDateTime(b.createdAt).split(' • ')[0]}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-[1fr_1fr]">
              <div className="relative h-56 overflow-hidden rounded-xl bg-muted md:h-full md:min-h-64">
                {b.coverImageUrl && (
                  <AppImage src={b.coverImageUrl} alt={`${SERVICE_LABELS[b.serviceType]} booking`} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                )}
              </div>

              <dl className="space-y-4 rounded-xl border border-border bg-secondary/40 p-4">
                <InfoRow icon="CalendarDaysIcon" label="Date" value={formatDate(b.scheduledDate)} />
                <InfoRow icon="ClockIcon" label="Arrival window" value={`${windowLabel(b)} · about ${durationLabel(b.estimatedDurationMin)}`} />
                <InfoRow icon="MapPinIcon" label={b.destination ? 'Moving from' : 'Service address'} value={b.origin.formatted} />
                {b.destination && <InfoRow icon="FlagIcon" label="Moving to" value={b.destination.formatted} />}
                <div className="flex gap-3">
                  <Icon name="UserIcon" size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Your pro</dt>
                    <dd className="mt-1">
                      {b.provider ? (
                        <span className="flex items-center gap-2">
                          {b.provider.avatarUrl && <Avatar src={b.provider.avatarUrl} alt={b.provider.avatarAlt ?? b.provider.name} size={36} />}
                          <span>
                            <span className="block text-sm font-bold text-foreground">{b.provider.name}</span>
                            <span className="tabular flex items-center gap-1 text-xs text-muted-foreground">
                              <Icon name="StarIcon" size={12} variant="solid" className="text-warning" />
                              {b.provider.rating.toFixed(1)} ({b.provider.reviewCount} reviews)
                            </span>
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">We&apos;re matching you with a pro.</span>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </section>
        </div>

        <aside className="xl:col-span-4 xl:col-start-9 xl:row-span-2 xl:row-start-1">
          <DetailsSidebar booking={b} onUpdated={update} onNotify={setToast} />
        </aside>

        <div className="min-w-0 space-y-6 xl:col-span-8">
          <BookingProgress booking={b} />
          <DetailsTabs booking={b} onUpdated={update} onNotify={setToast} />
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

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
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
