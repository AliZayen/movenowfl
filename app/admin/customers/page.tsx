'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, ErrorBox, inputCls, Loading, PageHeader, Pager, Pill } from '@/app/admin/components/ui';
import { qs, useApi } from '@/app/lib/api/client';
import { formatDate } from '@/app/lib/api/format';
import type { AdminCustomerList } from '@/app/lib/api/types';

export default function AdminCustomersPage() {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);
  const { data, error, reload } = useApi<AdminCustomerList>(`/admin/customers${qs({ q, page, pageSize: 25 })}`);

  return (
    <>
      <PageHeader title="Customers" subtitle="Read-only. Search by name, email or phone." />
      <Card>
        <div className="border-b border-border p-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search customers" aria-label="Search customers" className={`${inputCls} max-w-sm`} />
        </div>
        {error && <ErrorBox message={error.message} onRetry={reload} />}
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Customer</th>
                  <th className="px-3 py-2.5 font-semibold">Phone</th>
                  <th className="px-3 py-2.5 font-semibold">Bookings</th>
                  <th className="px-3 py-2.5 font-semibold">Last booking</th>
                  <th className="px-5 py-2.5 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="font-bold text-primary hover:text-accent-strong hover:underline">
                        {c.name}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {c.email} {!c.emailVerified && <Pill tone="warning">Unverified</Pill>}
                      </span>
                    </td>
                    <td className="px-3 py-3">{c.phone ?? '—'}</td>
                    <td className="tabular px-3 py-3">{c.bookingCount}</td>
                    <td className="px-3 py-3">{c.lastBookingAt ? formatDate(c.lastBookingAt) : '—'}</td>
                    <td className="px-5 py-3">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
