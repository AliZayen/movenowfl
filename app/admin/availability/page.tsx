'use client';

import React, { useState } from 'react';
import { btnPrimary, Card, ErrorBox, Field, inputCls, Loading, PageHeader, useToast } from '@/app/admin/components/ui';
import { api, errorMessage, useApi } from '@/app/lib/api/client';
import { formatDate, timeLabel } from '@/app/lib/api/format';
import type { AdminBlockList, AdminProviderList } from '@/app/lib/api/types';
import { SERVICE_LABELS, SERVICE_TYPES, SLOT_TIMES } from '@/app/lib/catalog';

// Close a day or one time slot (holiday, storm, staff shortage). Customers stop seeing those slots;
// bookings already made are not moved.
export default function AdminAvailabilityPage() {
  const { data, error, reload } = useApi<AdminBlockList>('/admin/availability-blocks');
  const areas = useApi<AdminProviderList>('/admin/providers').data?.areas ?? [];
  const { notify, toast } = useToast();
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [service, setService] = useState('');
  const [areaId, setAreaId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ affectedBookings: number }>('/admin/availability-blocks', {
        method: 'POST',
        body: { date, slot: slot || null, serviceType: service || null, areaId: areaId || null, reason: reason.trim() || undefined },
      });
      notify(res.affectedBookings ? `Blocked. ${res.affectedBookings} existing booking(s) that day weren't moved; check them.` : 'Blocked');
      setReason('');
      reload();
    } catch (err) {
      notify(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/admin/availability-blocks/${id}`, { method: 'DELETE' });
      notify('Reopened');
      reload();
    } catch (err) {
      notify(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Availability" subtitle="Close a whole day or a single time slot. Customers stop seeing those times when booking." />
      <Card title="Add a closure" className="mb-6">
        <form onSubmit={add} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Date" htmlFor="b-date">
            <input id="b-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Time" htmlFor="b-slot">
            <select id="b-slot" value={slot} onChange={(e) => setSlot(e.target.value)} className={inputCls}>
              <option value="">Whole day</option>
              {SLOT_TIMES.map((t) => (
                <option key={t} value={t}>
                  {timeLabel(t)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Service" htmlFor="b-service">
            <select id="b-service" value={service} onChange={(e) => setService(e.target.value)} className={inputCls}>
              <option value="">All services</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Area" htmlFor="b-area">
            <select id="b-area" value={areaId} onChange={(e) => setAreaId(e.target.value)} className={inputCls}>
              <option value="">All areas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reason (staff only)" htmlFor="b-reason">
            <input id="b-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Thanksgiving" className={inputCls} />
          </Field>
          <div className="lg:col-span-5">
            <button type="submit" disabled={busy || !date} className={btnPrimary}>
              {busy ? 'Saving…' : 'Block'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Upcoming closures">
        {error && <ErrorBox message={error.message} onRetry={reload} />}
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No closures planned. Every slot follows normal capacity.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.items.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>
                  <span className="font-bold text-foreground">{formatDate(b.date)}</span> · {b.slot ? timeLabel(b.slot) : 'whole day'} · {b.serviceLabel ?? 'all services'} ·{' '}
                  {b.areaName ?? 'all areas'}
                  {b.reason && <span className="block text-xs text-muted-foreground">{b.reason}</span>}
                </span>
                <button type="button" onClick={() => remove(b.id)} className="text-sm font-bold text-accent-strong hover:underline">
                  Reopen
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {toast}
    </>
  );
}
