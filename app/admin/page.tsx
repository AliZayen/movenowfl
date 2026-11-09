'use client';

import React from 'react';
import Link from 'next/link';
import { BookingRows } from '@/app/admin/components/BookingRows';
import { Card, ErrorBox, Loading, PageHeader, Stat } from '@/app/admin/components/ui';
import { useSession } from '@/app/components/SessionProvider';
import { useApi } from '@/app/lib/api/client';
import { formatDate } from '@/app/lib/api/format';
import type { AdminOverview } from '@/app/lib/api/types';

export default function AdminOverviewPage() {
  const { user } = useSession();
  const { data, error, reload } = useApi<AdminOverview>('/admin/overview');
  const c = data?.counts;
  const canSupport = user?.permissions.includes('support.reply');

  return (
    <>
      <PageHeader title={`Hello, ${user?.fullName.split(' ')[0] || 'there'}`} subtitle={data ? `Today is ${formatDate(data.today)}` : 'Loading today…'} />
      {error && <ErrorBox message={error.message} onRetry={reload} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Waiting for a pro" value={c?.pending} icon="ClockIcon" tone={c?.pending ? 'warning' : 'default'} href="/admin/bookings?status=pending&sort=created_asc" />
        <Stat label="No provider yet" value={c?.unassigned} icon="UserMinusIcon" tone={c?.unassigned ? 'warning' : 'default'} href="/admin/bookings?unassigned=true" />
        <Stat label="Jobs today" value={c?.todayJobs} icon="CalendarDaysIcon" tone="accent" href={data ? `/admin/bookings?from=${data.today}&to=${data.today}&sort=scheduled_asc` : undefined} />
        <Stat label="In progress" value={c?.inProgress} icon="TruckIcon" href="/admin/bookings?status=in_progress" />
        <Stat label="Unread support" value={c?.supportUnread} icon="ChatBubbleLeftRightIcon" tone={c?.supportUnread ? 'accent' : 'default'} href={canSupport ? '/messages' : undefined} />
        <Stat label="New customers (7 days)" value={c?.newCustomers} icon="UserPlusIcon" href="/admin/customers" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card
          title="Waiting for a pro (oldest first)"
          actions={
            <Link href="/admin/bookings?status=pending&sort=created_asc" className="text-xs font-bold text-accent-strong hover:underline">
              View all {c?.pending ?? ''}
            </Link>
          }
        >
          {!data ? <Loading rows={3} /> : <BookingRows items={data.queue} empty="Nothing is waiting. Nice." compact />}
        </Card>
        <Card title="Today's jobs">{!data ? <Loading rows={3} /> : <BookingRows items={data.schedule} empty="No jobs scheduled today." compact />}</Card>
      </div>
    </>
  );
}
