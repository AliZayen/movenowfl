'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, dateTime, ErrorBox, inputCls, Loading, PageHeader, Pager } from '@/app/admin/components/ui';
import { qs, useApi } from '@/app/lib/api/client';
import type { AdminAuditList } from '@/app/lib/api/types';

const TYPES = [
  { id: '', label: 'Everything' },
  { id: 'booking', label: 'Bookings' },
  { id: 'provider', label: 'Providers' },
  { id: 'user', label: 'Staff and sign-ins' },
  { id: 'availability_block', label: 'Availability' },
];

// Every staff action, newest first. Rows can't be edited or deleted from the app.
export default function AdminAuditPage() {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, reload } = useApi<AdminAuditList>(`/admin/audit${qs({ targetType: type, page })}`);

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every staff action, who did it and when. Entries can't be changed." />
      <Card>
        <div className="border-b border-border p-4">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            aria-label="Filter"
            className={`${inputCls} w-auto`}
          >
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {error && <ErrorBox message={error.message} onRetry={reload} />}
        {!data ? (
          <Loading rows={8} />
        ) : data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.items.map((a) => (
              <li key={a.id} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[170px_1fr_auto]">
                <span className="text-xs text-muted-foreground">{dateTime(a.createdAt)}</span>
                <span>
                  <span className="text-foreground">{a.summary}</span>
                  <span className="block text-xs text-muted-foreground">
                    {a.actor} · <code>{a.action}</code>
                    {a.ip && ` · ${a.ip}`}
                  </span>
                </span>
                {a.targetType === 'booking' && a.targetId && (
                  <Link href={`/admin/bookings/${a.targetId}`} className="text-xs font-bold text-accent-strong hover:underline">
                    Open booking
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
        {data && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
