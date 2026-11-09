'use client';

import React, { useState } from 'react';
import { btnDanger, btnPrimary, btnSecondary, Card, Field, inputCls } from '@/app/admin/components/ui';
import { api, errorMessage } from '@/app/lib/api/client';
import { timeLabel } from '@/app/lib/api/format';
import type { AdminBookingDetail, ApiBookingDetail } from '@/app/lib/api/types';
import { SLOT_TIMES } from '@/app/lib/catalog';

interface Props {
  data: AdminBookingDetail;
  onDone: (booking: ApiBookingDetail, message: string) => void;
  onError: (message: string) => void;
}

const END_TIMES = [...SLOT_TIMES.slice(1), '20:00', '21:00'];
const addHours = (hhmm: string, h: number) => `${String(Math.min(21, Number(hhmm.slice(0, 2)) + h)).padStart(2, '0')}:00`;

// What staff can do next depends on the status; the server re-checks every action.
export default function BookingActions({ data, onDone, onError }: Props) {
  const b = data.booking;
  const [busy, setBusy] = useState<string | null>(null);
  const [panel, setPanel] = useState<'none' | 'cancel'>('none');

  const run = async (key: string, path: string, body: object, message: string) => {
    setBusy(key);
    try {
      const { booking } = await api<{ booking: ApiBookingDetail }>(`/admin/bookings/${b.id}/${path}`, { method: 'POST', body });
      setPanel('none');
      onDone(booking, message);
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (b.status === 'completed' || b.status === 'cancelled') {
    return (
      <Card title="Actions">
        <p className="p-5 text-sm text-muted-foreground">This booking is {b.status}. Nothing left to do.</p>
      </Card>
    );
  }

  return (
    <Card title="Actions">
      <div className="space-y-5 p-5">
        {b.status === 'pending' && <ConfirmForm data={data} busy={busy === 'confirm'} onSubmit={(body) => run('confirm', 'confirm', body, `${b.ref} confirmed. The customer can see the pro and arrival window.`)} />}

        {(b.status === 'confirmed' || (b.status === 'pending' && b.provider)) && (
          <ReassignForm data={data} busy={busy === 'assign'} onSubmit={(providerId) => run('assign', 'assign', { providerId }, 'Provider changed')} />
        )}

        {b.status === 'confirmed' && (
          <button type="button" disabled={!!busy} onClick={() => run('start', 'status', { status: 'in_progress' }, 'Job marked as started')} className={`${btnSecondary} w-full`}>
            {busy === 'start' ? 'Saving…' : 'Mark job as started'}
          </button>
        )}
        {b.status === 'in_progress' && (
          <button type="button" disabled={!!busy} onClick={() => run('complete', 'status', { status: 'completed' }, 'Job marked as completed')} className={`${btnPrimary} w-full`}>
            {busy === 'complete' ? 'Saving…' : 'Mark job as completed'}
          </button>
        )}

        {panel === 'cancel' ? (
          <CancelForm busy={busy === 'cancel'} onBack={() => setPanel('none')} onSubmit={(reason) => run('cancel', 'cancel', { reason }, `${b.ref} cancelled`)} />
        ) : (
          <button type="button" onClick={() => setPanel('cancel')} className={`${btnDanger} w-full`}>
            Cancel booking…
          </button>
        )}
      </div>
    </Card>
  );
}

function ProviderSelect({ data, value, onChange, id }: { data: AdminBookingDetail; value: string; onChange: (v: string) => void; id: string }) {
  if (data.candidates.length === 0) {
    return <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">No active provider offers this service in this ZIP. Add or activate one in Providers.</p>;
  }
  return (
    <>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">Choose a provider</option>
        {data.candidates.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · ★{p.rating.toFixed(1)} · {p.jobsThatDay.length ? `${p.jobsThatDay.length} other job${p.jobsThatDay.length > 1 ? 's' : ''} that day` : 'free that day'}
          </option>
        ))}
      </select>
      {value && <JobsThatDay data={data} providerId={value} />}
    </>
  );
}

function JobsThatDay({ data, providerId }: { data: AdminBookingDetail; providerId: string }) {
  const p = data.candidates.find((c) => c.id === providerId);
  if (!p?.jobsThatDay.length) return null;
  return (
    <ul className="mt-2 space-y-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
      {p.jobsThatDay.map((j) => (
        <li key={j.ref}>
          {j.ref}: {timeLabel(j.start)}
          {j.end ? `–${timeLabel(j.end)}` : ` (~${Math.round(j.durationMin / 60)} h)`}
        </li>
      ))}
    </ul>
  );
}

function ConfirmForm({ data, busy, onSubmit }: { data: AdminBookingDetail; busy: boolean; onSubmit: (body: object) => void }) {
  const b = data.booking;
  const fallbackStart = SLOT_TIMES.includes(b.preferredSlot as (typeof SLOT_TIMES)[number]) ? b.preferredSlot : '10:00';
  const [providerId, setProviderId] = useState(b.provider?.id ?? '');
  const [start, setStart] = useState(fallbackStart);
  const [end, setEnd] = useState(addHours(fallbackStart, 2));
  const [price, setPrice] = useState(b.quotedPriceCents !== null ? String(b.quotedPriceCents / 100) : '');
  const cents = price.trim() === '' ? undefined : Math.round(Number(price) * 100);
  const priceInvalid = cents !== undefined && (!Number.isFinite(cents) || cents < 0);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ providerId, windowStart: start, windowEnd: end, ...(cents !== undefined ? { finalPriceCents: cents } : {}) });
      }}
    >
      <p className="text-sm font-bold text-foreground">Confirm this request</p>
      <p className="text-xs text-muted-foreground">Customer asked for {timeLabel(b.preferredSlot)}.</p>
      <Field label="Provider" htmlFor="confirm-provider">
        <ProviderSelect id="confirm-provider" data={data} value={providerId} onChange={setProviderId} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Arrival from" htmlFor="win-start">
          <select
            id="win-start"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              if (end <= e.target.value) setEnd(addHours(e.target.value, 2));
            }}
            className={inputCls}
          >
            {SLOT_TIMES.map((t) => (
              <option key={t} value={t}>
                {timeLabel(t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="to" htmlFor="win-end">
          <select id="win-end" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls}>
            {END_TIMES.filter((t) => t > start).map((t) => (
              <option key={t} value={t}>
                {timeLabel(t)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Final price ($)" htmlFor="final-price" hint="Leave as is to keep the estimate." error={priceInvalid ? 'Enter a valid amount' : undefined}>
        <input id="final-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} aria-invalid={priceInvalid} />
      </Field>
      <button type="submit" disabled={busy || !providerId || priceInvalid} className={`${btnPrimary} w-full`}>
        {busy ? 'Confirming…' : 'Confirm booking'}
      </button>
    </form>
  );
}

function ReassignForm({ data, busy, onSubmit }: { data: AdminBookingDetail; busy: boolean; onSubmit: (providerId: string) => void }) {
  const current = data.booking.provider?.id ?? '';
  const [providerId, setProviderId] = useState('');
  const options = { ...data, candidates: data.candidates.filter((c) => c.id !== current) };
  return (
    <form
      className="space-y-2 border-t border-border pt-4 first:border-0 first:pt-0"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(providerId);
      }}
    >
      <Field label="Change provider" htmlFor="reassign">
        <ProviderSelect id="reassign" data={options} value={providerId} onChange={setProviderId} />
      </Field>
      <button type="submit" disabled={busy || !providerId} className={`${btnSecondary} w-full`}>
        {busy ? 'Saving…' : 'Assign this provider'}
      </button>
    </form>
  );
}

function CancelForm({ busy, onBack, onSubmit }: { busy: boolean; onBack: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <form
      role="alertdialog"
      aria-label="Cancel booking"
      className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(reason.trim());
      }}
    >
      <Field label="Why is it cancelled? (saved in the audit log)" htmlFor="cancel-reason">
        <textarea id="cancel-reason" autoFocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} h-auto py-2`} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onBack} className={btnSecondary}>
          Keep booking
        </button>
        <button type="submit" disabled={busy || reason.trim().length < 3} className="inline-flex h-10 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? 'Cancelling…' : 'Cancel booking'}
        </button>
      </div>
    </form>
  );
}
