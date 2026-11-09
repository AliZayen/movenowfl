'use client';

import React from 'react';
import Link from 'next/link';
import { Pill, Status } from '@/app/admin/components/ui';
import { formatDate, money, windowLabel } from '@/app/lib/api/format';
import type { AdminBooking } from '@/app/lib/api/types';

// Booking list used on the overview, the bookings page and a customer's page.
export function BookingRows({ items, empty, compact = false }: { items: AdminBooking[]; empty: string; compact?: boolean }) {
  if (items.length === 0) return <p className="px-5 py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="px-5 py-2.5 font-semibold">Booking</th>
            <th className="px-3 py-2.5 font-semibold">When</th>
            {!compact && <th className="px-3 py-2.5 font-semibold">Customer</th>}
            <th className="px-3 py-2.5 font-semibold">Provider</th>
            <th className="px-3 py-2.5 font-semibold">Status</th>
            {!compact && <th className="px-5 py-2.5 text-right font-semibold">Price</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((b) => (
            <tr key={b.id} className="hover:bg-muted/50">
              <td className="px-5 py-3">
                <Link href={`/admin/bookings/${b.ref}`} className="font-bold text-primary hover:text-accent-strong hover:underline">
                  {b.ref}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {b.serviceLabel}
                  {compact && ` · ${b.customer.name}`}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="block font-medium text-foreground">{formatDate(b.scheduledDate)}</span>
                <span className="text-xs text-muted-foreground">{windowLabel(b)}</span>
              </td>
              {!compact && (
                <td className="px-3 py-3">
                  <Link href={`/admin/customers/${b.customer.id}`} className="font-medium text-foreground hover:underline">
                    {b.customer.name}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">{b.address}</span>
                </td>
              )}
              <td className="px-3 py-3">{b.provider ? <span className="text-foreground">{b.provider.name}</span> : <Pill tone="warning">Unassigned</Pill>}</td>
              <td className="px-3 py-3">
                <Status status={b.status} />
              </td>
              {!compact && <td className="tabular px-5 py-3 text-right font-semibold">{money(b.finalPriceCents ?? b.quotedPriceCents)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
