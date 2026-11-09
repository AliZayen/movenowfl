'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';
import { PHONE_PRIMARY } from '@/app/lib/contact';
import { api, errorMessage, qs, useApi } from '@/app/lib/api/client';
import { useMessageBooking } from '@/app/lib/api/messaging';
import { formatDate, money, timeLabel } from '@/app/lib/api/format';
import type { ApiAvailability, ApiBookingDetail } from '@/app/lib/api/types';

interface DetailsSidebarProps {
  booking: ApiBookingDetail;
  onUpdated: (booking: ApiBookingDetail, message: string) => void;
  onNotify: (msg: string) => void;
}

type Panel = 'actions' | 'confirm-cancel' | 'reschedule';

// What the viewer may do comes from the API (`booking.permissions`), so the UI and the server agree.
export default function DetailsSidebar({ booking: b, onUpdated, onNotify }: DetailsSidebarProps) {
  const [panel, setPanel] = useState<Panel>('actions');
  const [busy, setBusy] = useState(false);
  const { canCancel, canReschedule } = b.permissions;
  const open = b.status === 'pending' || b.status === 'confirmed';
  const phone = b.provider && 'phone' in b.provider ? (b.provider as { phone?: string | null }).phone : null;

  const message = useMessageBooking(onNotify);
  const messageButton = (primary: boolean) => (
    <ActionButton
      icon="ChatBubbleOvalLeftEllipsisIcon"
      label={message.busyId ? 'Opening…' : b.provider ? `Message ${b.provider.name}` : 'Message us'}
      primary={primary}
      onClick={() => message.start(b.id)}
    />
  );

  const cancel = async () => {
    setBusy(true);
    try {
      const { booking } = await api<{ booking: ApiBookingDetail }>(`/bookings/${b.id}/cancel`, { method: 'POST', body: {} });
      setPanel('actions');
      onUpdated(booking, `Booking ${booking.ref} was cancelled`);
    } catch (e) {
      onNotify(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <section id="manage" aria-labelledby="manage-title" className="scroll-mt-32 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 id="manage-title" className="text-base font-bold text-foreground">
          Manage booking
        </h2>

        {open && panel === 'actions' && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Changes are free up to 24 hours before your arrival window.</p>
            <div className="mt-4 space-y-2">
              {phone && (
                <a href={`tel:${phone}`} className={btn(true)}>
                  <Icon name="PhoneIcon" size={18} /> Call {b.provider?.name}
                </a>
              )}
              {messageButton(!phone)}
              {canReschedule && <ActionButton icon="CalendarDaysIcon" label="Reschedule" onClick={() => setPanel('reschedule')} />}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => setPanel('confirm-cancel')}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Icon name="XCircleIcon" size={18} /> Cancel booking
                </button>
              )}
            </div>
          </>
        )}

        {open && panel === 'reschedule' && (
          <ReschedulePanel booking={b} onCancel={() => setPanel('actions')} onDone={(booking) => { setPanel('actions'); onUpdated(booking, 'Booking rescheduled. We\'ll confirm the new arrival window.'); }} onError={onNotify} />
        )}

        {open && panel === 'confirm-cancel' && (
          <div role="alertdialog" aria-labelledby="cancel-title" aria-describedby="cancel-desc" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p id="cancel-title" className="text-sm font-bold text-foreground">
              Cancel this booking?
            </p>
            <p id="cancel-desc" className="mt-1 text-sm text-muted-foreground">
              {formatDate(b.scheduledDate)}. {b.provider ? 'Your pro will be notified. ' : ''}This can&apos;t be undone.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" autoFocus disabled={busy} onClick={() => setPanel('actions')} className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground hover:bg-muted">
                Keep booking
              </button>
              <button type="button" disabled={busy} onClick={cancel} className="min-h-11 rounded-lg bg-destructive px-3 text-sm font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-60">
                {busy ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        )}

        {b.status === 'in_progress' && (
          <>
            <p className="mt-3 text-sm text-muted-foreground">Your pro is on the job. Call us at {PHONE_PRIMARY.display} if anything comes up.</p>
            <div className="mt-4 space-y-2">
              {phone && (
                <a href={`tel:${phone}`} className={btn(true)}>
                  <Icon name="PhoneIcon" size={18} /> Call {b.provider?.name}
                </a>
              )}
              {messageButton(!phone)}
            </div>
          </>
        )}

        {b.status === 'completed' && (
          <div className="mt-4 space-y-2">
            <ActionButton icon="StarIcon" label={b.provider ? `Rate ${b.provider.name}` : 'Rate your pro'} primary onClick={() => onNotify('Ratings are coming soon. Thanks for booking with us!')} />
            {messageButton(false)}
            <ActionButton icon="DocumentTextIcon" label="Email receipt" onClick={() => onNotify(`Email receipts are coming soon. Call us at ${PHONE_PRIMARY.display} if you need one now.`)} />
            <BookAgain />
          </div>
        )}

        {b.status === 'cancelled' && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">This booking was cancelled.</p>
            <BookAgain />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{b.finalPriceCents !== null ? 'Price' : 'Estimate'}</span>
          <span className="tabular text-xl font-extrabold text-foreground">{money(b.finalPriceCents ?? b.quotedPriceCents)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {b.finalPriceCents !== null ? 'Confirmed by your pro.' : 'Your pro confirms the final price before the job starts.'}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-sm font-bold text-foreground">Need help?</p>
        <a href={PHONE_PRIMARY.href} className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-strong hover:underline">
          <Icon name="PhoneIcon" size={18} /> Call MoveNow: {PHONE_PRIMARY.display}
        </a>
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Icon name="ShieldCheckIcon" size={16} className="mt-px shrink-0 text-success" />
          Every pro is background-checked and insured, and your payment is held securely.
        </p>
      </section>
    </div>
  );
}

// Pick a new date and an open slot (GET /availability), then POST /bookings/:id/reschedule.
function ReschedulePanel({ booking: b, onCancel, onDone, onError }: { booking: ApiBookingDetail; onCancel: () => void; onDone: (b: ApiBookingDetail) => void; onError: (m: string) => void }) {
  const [date, setDate] = useState(b.scheduledDate);
  const [slot, setSlot] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, error, loading } = useApi<ApiAvailability>(`/availability${qs({ service: b.serviceType, zip: b.origin.zip, date })}`);

  const save = async () => {
    setBusy(true);
    try {
      const { booking } = await api<{ booking: ApiBookingDetail }>(`/bookings/${b.id}/reschedule`, { method: 'POST', body: { date, preferredSlot: slot } });
      onDone(booking);
    } catch (e) {
      onError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <div>
        <label htmlFor="reschedule-date" className="mb-1 block text-sm font-medium text-foreground">
          New date
        </label>
        <input
          id="reschedule-date"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSlot('');
          }}
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">New time</legend>
        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2" aria-busy={loading}>
            {(data?.slots ?? []).map((s) => {
              const current = date === b.scheduledDate && s.time === b.preferredSlot;
              return (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available || current || loading}
                  aria-pressed={slot === s.time}
                  onClick={() => setSlot(s.time)}
                  title={current ? 'Your current time' : undefined}
                  className={`tabular rounded-lg border px-1 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground/60 ${
                    slot === s.time ? 'border-accent bg-accent/10 text-accent-strong' : 'border-border bg-card text-foreground hover:border-accent/50'
                  }`}
                >
                  {timeLabel(s.time)}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>
      <p className="text-xs text-muted-foreground">Your booking goes back to pending until we confirm the new window.</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground hover:bg-muted">
          Back
        </button>
        <button type="button" disabled={!slot || busy} onClick={save} className="min-h-11 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? 'Saving…' : 'Confirm new time'}
        </button>
      </div>
    </div>
  );
}

const btn = (primary?: boolean) =>
  `flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors ${
    primary ? 'bg-primary text-primary-foreground hover:opacity-90' : 'border border-border text-foreground hover:bg-muted'
  }`;

function ActionButton({ icon, label, onClick, primary }: { icon: string; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={btn(primary)}>
      <Icon name={icon} size={18} /> {label}
    </button>
  );
}

function BookAgain() {
  return (
    <Link href="/book-service" className={btn()}>
      <Icon name="ArrowPathIcon" size={18} /> Book again
    </Link>
  );
}
