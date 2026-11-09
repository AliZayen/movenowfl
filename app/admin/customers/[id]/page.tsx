'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { BookingRows } from '@/app/admin/components/BookingRows';
import { Card, ErrorBox, Loading, PageHeader, Pill } from '@/app/admin/components/ui';
import { useApi } from '@/app/lib/api/client';
import { formatDate } from '@/app/lib/api/format';
import type { AdminCustomerDetail } from '@/app/lib/api/types';

export default function AdminCustomerPage() {
  return (
    <Suspense fallback={<Loading rows={6} />}>
      <Customer />
    </Suspense>
  );
}

function Customer() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useApi<AdminCustomerDetail>(`/admin/customers/${encodeURIComponent(id)}`);
  const back = { href: '/admin/customers', label: 'All customers' };

  if (error) {
    return (
      <>
        <PageHeader title="Customer" back={back} />
        <ErrorBox message={error.status === 404 ? 'Customer not found.' : error.message} onRetry={error.status === 404 ? undefined : reload} />
      </>
    );
  }
  if (!data) return <Loading rows={6} />;
  const c = data.customer;

  return (
    <>
      <PageHeader title={c.name} subtitle={`Customer since ${formatDate(c.createdAt)}`} back={back} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card title="Contact">
            <div className="space-y-2 p-5 text-sm">
              <p>
                <a href={`mailto:${c.email}`} className="text-primary hover:underline">
                  {c.email}
                </a>{' '}
                {c.emailVerified ? <Pill tone="success">Verified</Pill> : <Pill tone="warning">Unverified</Pill>}
              </p>
              <p>{c.phone ? <a href={`tel:${c.phone}`} className="text-primary hover:underline">{c.phone}</a> : <span className="text-muted-foreground">No phone</span>}</p>
              {c.deleted && <Pill tone="danger">Account deleted</Pill>}
            </div>
          </Card>
          <Card title="Saved addresses">
            {data.addresses.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-2 p-5 text-sm">
                {data.addresses.map((a) => (
                  <li key={a.id}>
                    {a.label && <span className="font-semibold text-foreground">{a.label}: </span>}
                    {a.formatted}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card title={`Bookings (${data.bookings.length})`}>
          <BookingRows items={data.bookings} empty="No bookings yet." compact />
        </Card>
      </div>
    </>
  );
}
