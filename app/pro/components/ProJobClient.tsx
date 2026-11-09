'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';
import StatusBadge from '@/app/components/ui/StatusBadge';
import { requestRows } from '@/app/my-bookings/[id]/components/DetailsTabs';
import { useApi } from '@/app/lib/api/client';
import { durationLabel, formatDate, money, UI_STATUS, windowLabel } from '@/app/lib/api/format';
import { useMessageBooking } from '@/app/lib/api/messaging';
import type { ApiBookingDetail } from '@/app/lib/api/types';

// One job, as the assigned pro sees it. GET /bookings/:id returns 404 for jobs that aren't theirs.
// The customer's phone number is shared once the job is confirmed.
export default function ProJobClient({ id }: { id: string }) {
  const { data, error } = useApi<{ booking: ApiBookingDetail }>(`/bookings/${id}`);
  const [msgError, setMsgError] = useState<string | null>(null);
  const { start, busyId } = useMessageBooking(setMsgError);
  const b = data?.booking;

  if (error?.status === 404) {
    return (
      <div className="py-20 text-center">
        <p className="text-base font-bold text-foreground">Job not found</p>
        <p className="mt-1 text-sm text-muted-foreground">It may have been reassigned to another pro.</p>
        <Link href="/pro" className="mt-4 inline-block text-sm font-bold text-accent-strong hover:underline">
          Back to my jobs
        </Link>
      </div>
    );
  }
  if (error) return <p role="alert" className="py-20 text-center text-sm text-destructive">Couldn’t load this job. Please refresh.</p>;
  if (!b) return <p className="py-20 text-center text-sm text-muted-foreground">Loading job…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/pro" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-accent-strong">
        <Icon name="ArrowLeftIcon" size={16} /> My jobs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{b.serviceLabel}</h1>
          <p className="text-sm text-muted-foreground">{b.ref}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={UI_STATUS[b.status]} />
          <button
            type="button"
            onClick={() => start(b.id)}
            disabled={busyId === b.id}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-60"
          >
            <Icon name="ChatBubbleOvalLeftEllipsisIcon" size={18} />
            {busyId === b.id ? 'Opening…' : 'Conversation'}
          </button>
        </div>
      </div>
      {msgError && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {msgError}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Schedule">
          <Rows
            rows={[
              ['Date', formatDate(b.scheduledDate)],
              ['Arrival window', windowLabel(b)],
              ['Estimated length', durationLabel(b.estimatedDurationMin)],
              ['Price', money(b.finalPriceCents ?? b.quotedPriceCents)],
            ]}
          />
        </Section>
        <Section title="Customer">
          <Rows
            rows={[
              ['Name', b.customer?.name ?? '—'],
              ['Phone', b.customer?.phone ?? 'Shared once the job is confirmed'],
            ]}
          />
        </Section>
        <Section title={b.destination ? 'Pickup' : 'Address'}>
          <p className="text-sm text-foreground">{b.origin.formatted}</p>
          {b.origin.accessNotes && <p className="mt-2 text-sm text-muted-foreground">Access: {b.origin.accessNotes}</p>}
        </Section>
        {b.destination && (
          <Section title="Drop-off">
            <p className="text-sm text-foreground">{b.destination.formatted}</p>
            {b.destination.accessNotes && <p className="mt-2 text-sm text-muted-foreground">Access: {b.destination.accessNotes}</p>}
          </Section>
        )}
      </div>

      <Section title="Job details">
        <Rows rows={requestRows(b)} />
        {b.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{b.notes}</p>}
      </Section>

      {b.photos.length > 0 && (
        <Section title="Photos from the customer">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {b.photos.map((p) => (
              <li key={p.id}>
                <a href={p.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- served by our own photo route */}
                  <img src={p.thumbUrl} alt={p.fileName} className="aspect-square w-full rounded-lg object-cover" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <h2 className="mb-3 text-sm font-extrabold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,10rem)_1fr] gap-x-3 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
