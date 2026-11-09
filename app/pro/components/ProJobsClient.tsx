'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/app/components/ui/AppIcon';
import StatusBadge from '@/app/components/ui/StatusBadge';
import { useSession } from '@/app/components/SessionProvider';
import { qs, useApi } from '@/app/lib/api/client';
import { durationLabel, formatDate, UI_STATUS, windowLabel } from '@/app/lib/api/format';
import { useMessageBooking } from '@/app/lib/api/messaging';
import type { ApiBooking, ApiStats, Paginated } from '@/app/lib/api/types';

// Provider home: the jobs assigned to this pro. GET /bookings is already scoped to the
// signed-in provider on the server, so this page never sees anyone else's jobs.
const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'all', label: 'All jobs' },
] as const;

export default function ProJobsClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useSession();
  const tab = params.get('tab') === 'all' ? 'all' : 'upcoming';
  const q = params.get('q') ?? '';
  const [error, setError] = useState<string | null>(null);
  const { start, busyId } = useMessageBooking(setError);

  const list = useApi<Paginated<ApiBooking>>(
    `/bookings${qs({ upcoming: tab === 'upcoming' || undefined, q, sort: 'upcomingFirst', pageSize: 50 })}`,
  );
  const stats = useApi<ApiStats>('/bookings/stats');

  const setTab = (id: string) => router.replace(`/pro${qs({ tab: id === 'all' ? 'all' : undefined, q })}`);
  const firstName = user?.fullName.split(/\s+/)[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{firstName ? `Hi ${firstName}, here are your jobs` : 'My jobs'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Jobs dispatch has assigned to you. You moderate each job’s conversation with the customer.</p>
        </div>
        <Link href="/messages" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold text-primary hover:border-accent-strong hover:text-accent-strong">
          <Icon name="ChatBubbleOvalLeftEllipsisIcon" size={18} /> Conversations
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Upcoming', stats.data?.upcoming],
          ['Pending', stats.data?.pending],
          ['Confirmed', stats.data?.confirmed],
          ['Completed', stats.data?.completed],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-border bg-card p-4">
            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
            <dd className="tabular mt-1 text-2xl font-extrabold text-foreground">{value ?? '–'}</dd>
          </div>
        ))}
      </dl>

      <div role="tablist" aria-label="Job filter" className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold ${tab === t.id ? 'border-accent-strong text-accent-strong' : 'border-transparent text-primary hover:text-accent-strong'}`}
          >
            {t.label}
          </button>
        ))}
        {q && <span className="ml-auto self-center text-xs text-muted-foreground">Search: “{q}”</span>}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {list.error && <p role="alert" className="text-sm text-destructive">Couldn’t load your jobs. Please refresh.</p>}
      {!list.data && !list.error && <p className="py-10 text-center text-sm text-muted-foreground">Loading jobs…</p>}
      {list.data?.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-base font-bold text-foreground">{tab === 'upcoming' ? 'No upcoming jobs' : 'No jobs yet'}</p>
          <p className="mt-1 text-sm text-muted-foreground">When dispatch assigns you a job, it shows up here.</p>
        </div>
      )}

      <ul className="grid gap-3 lg:grid-cols-2">
        {list.data?.items.map((b) => (
          <li key={b.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-foreground">{b.serviceLabel}</p>
                <p className="text-xs text-muted-foreground">{b.ref}</p>
              </div>
              <StatusBadge status={UI_STATUS[b.status]} />
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">When</dt>
              <dd className="font-semibold text-foreground">
                {formatDate(b.scheduledDate)} · {windowLabel(b)}
              </dd>
              <dt className="text-muted-foreground">Where</dt>
              <dd className="text-foreground">{b.address}</dd>
              {b.destinationAddress && (
                <>
                  <dt className="text-muted-foreground">To</dt>
                  <dd className="text-foreground">{b.destinationAddress}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Length</dt>
              <dd className="text-foreground">{durationLabel(b.estimatedDurationMin)}</dd>
            </dl>
            <div className="mt-auto flex gap-2">
              <Link href={`/pro/jobs/${b.id}`} className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-bold text-primary-foreground hover:opacity-90">
                Job details
              </Link>
              <button
                type="button"
                onClick={() => start(b.id)}
                disabled={busyId === b.id}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-bold text-primary hover:border-accent-strong hover:text-accent-strong disabled:opacity-60"
              >
                {busyId === b.id ? 'Opening…' : 'Message customer'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
