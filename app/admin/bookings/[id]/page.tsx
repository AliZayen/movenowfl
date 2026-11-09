'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import BookingActions from '@/app/admin/bookings/[id]/BookingActions';
import { Card, dateTime, ErrorBox, Loading, PageHeader, Pill, Status, useToast } from '@/app/admin/components/ui';
import { requestRows } from '@/app/my-bookings/[id]/components/DetailsTabs';
import { useSession } from '@/app/components/SessionProvider';
import { useApi } from '@/app/lib/api/client';
import { durationLabel, formatDate, money, windowLabel } from '@/app/lib/api/format';
import type { AdminBookingDetail } from '@/app/lib/api/types';

const EVENT_LABELS: Record<string, string> = {
  submitted: 'Request submitted',
  provider_assigned: 'Provider assigned',
  confirmed: 'Confirmed',
  rescheduled: 'Rescheduled',
  modified: 'Details changed',
  started: 'Job started',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function AdminBookingPage() {
  return (
    <Suspense fallback={<Loading rows={8} />}>
      <BookingDetail />
    </Suspense>
  );
}

function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSession();
  const { notify, toast } = useToast();
  const { data, error, reload, mutate } = useApi<AdminBookingDetail>(`/admin/bookings/${encodeURIComponent(id)}`);
  const canManage = !!user?.permissions.includes('bookings.manage');

  if (error) {
    return (
      <>
        <PageHeader title="Booking" back={{ href: '/admin/bookings', label: 'All bookings' }} />
        <ErrorBox message={error.status === 404 ? 'No booking with that reference.' : error.message} onRetry={error.status === 404 ? undefined : reload} />
      </>
    );
  }
  if (!data) return <Loading rows={8} />;

  const b = data.booking;
  const c = data.customer;

  return (
    <>
      <PageHeader
        title={`${b.ref} · ${b.serviceLabel}`}
        subtitle={`Requested ${dateTime(b.createdAt)}`}
        back={{ href: '/admin/bookings', label: 'All bookings' }}
        actions={<Status status={b.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Job">
            <dl className="grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
              <Row label="Date">{formatDate(b.scheduledDate)}</Row>
              <Row label="Arrival window">{windowLabel(b)}</Row>
              <Row label="Estimated time">{durationLabel(b.estimatedDurationMin)}</Row>
              <Row label="Price">
                {money(b.finalPriceCents ?? b.quotedPriceCents)} {b.finalPriceCents === null && <span className="text-xs text-muted-foreground">(estimate)</span>}
              </Row>
              <Row label={b.destination ? 'Pickup' : 'Address'}>{b.origin.formatted}</Row>
              {b.destination && <Row label="Drop-off">{b.destination.formatted}</Row>}
              {requestRows(b).map(([k, v]) => (
                <Row key={k} label={k}>
                  {v}
                </Row>
              ))}
              {b.origin.accessNotes && <Row label="Access notes">{b.origin.accessNotes}</Row>}
              <Row label="Customer notes" wide>
                {b.notes || '—'}
              </Row>
              {b.cancelReason && (
                <Row label="Cancel reason" wide>
                  {b.cancelReason}
                </Row>
              )}
            </dl>
          </Card>

          {b.photos.length > 0 && (
            <Card title={`Photos (${b.photos.length})`}>
              <ul className="grid grid-cols-3 gap-2 p-5 sm:grid-cols-5">
                {b.photos.map((p) => (
                  <li key={p.id} className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                    <a href={p.url} target="_blank" rel="noopener" aria-label={`Open ${p.fileName}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- private image served by the API */}
                      <img src={p.thumbUrl} alt={p.fileName} loading="lazy" className="h-full w-full object-cover" />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Timeline">
              <ol className="space-y-3 p-5 text-sm">
                {b.events.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <span>
                      <span className="font-semibold text-foreground">{EVENT_LABELS[e.type] ?? e.type}</span>
                      <span className="block text-xs text-muted-foreground">
                        {dateTime(e.at)}
                        {e.actor && ` · ${e.actor.name}${e.actor.role === 'admin' ? ' (staff)' : ''}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
            <Card title="Staff actions">
              {data.history.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">No staff actions yet.</p>
              ) : (
                <ol className="space-y-3 p-5 text-sm">
                  {data.history.map((h) => (
                    <li key={h.id}>
                      <span className="text-foreground">{h.summary}</span>
                      <span className="block text-xs text-muted-foreground">
                        {dateTime(h.createdAt)} · {h.actor}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {canManage && (
            <BookingActions
              data={data}
              onDone={(booking, message) => {
                notify(message);
                mutate({ ...data, booking });
                reload();
              }}
              onError={notify}
            />
          )}

          <Card title="Customer">
            {c ? (
              <div className="space-y-1 p-5 text-sm">
                <a href={`/admin/customers/${c.id}`} className="font-bold text-primary hover:text-accent-strong hover:underline">
                  {c.fullName || c.email}
                </a>
                <p>
                  <a href={`mailto:${c.email}`} className="text-muted-foreground hover:underline">
                    {c.email}
                  </a>
                </p>
                {c.phone && (
                  <p>
                    <a href={`tel:${c.phone}`} className="text-muted-foreground hover:underline">
                      {c.phone}
                    </a>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Customer since {formatDate(c.createdAt)}</p>
              </div>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">Account removed.</p>
            )}
          </Card>

          <Card title="Provider">
            {b.provider ? (
              <div className="space-y-1 p-5 text-sm">
                <p className="font-bold text-foreground">{b.provider.name}</p>
                {'phone' in b.provider && b.provider.phone && (
                  <a href={`tel:${b.provider.phone}`} className="block text-muted-foreground hover:underline">
                    {b.provider.phone}
                  </a>
                )}
                <p className="text-xs text-muted-foreground">
                  ★ {b.provider.rating.toFixed(1)} · {b.provider.reviewCount} reviews
                </p>
              </div>
            ) : (
              <p className="p-5 text-sm">
                <Pill tone="warning">Unassigned</Pill>
              </p>
            )}
          </Card>
        </div>
      </div>
      {toast}
    </>
  );
}

function Row({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{children}</dd>
    </div>
  );
}
