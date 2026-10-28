'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';
import { PHONE_PRIMARY } from '@/app/lib/contact';
import type { Booking, BookingStatus, ServiceType } from '@/app/data/mockData';

interface DetailsSidebarProps {
  booking: Booking;
  status: BookingStatus;
  onCancel: () => void;
  onNotify: (msg: string) => void;
}

// Same starting prices as /book-service. TODO: use quotedPriceCents / finalPriceCents from the API.
const startingPrice: Record<ServiceType, string> = {
  'Moving': '$70',
  'Furniture Assembly': '$50',
  'TV Mounting': '$70',
};

export default function DetailsSidebar({ booking: b, status, onCancel, onNotify }: DetailsSidebarProps) {
  const [confirming, setConfirming] = useState(false);
  const open = status === 'Pending' || status === 'Confirmed';

  return (
    <div className="space-y-5">
      <section id="manage" aria-labelledby="manage-title" className="scroll-mt-32 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 id="manage-title" className="text-base font-bold text-foreground">
          Manage booking
        </h2>

        {open && !confirming && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Changes are free up to 24 hours before your arrival window.</p>
            <div className="mt-4 space-y-2">
              <ActionButton icon="ChatBubbleOvalLeftEllipsisIcon" label={`Message ${b.provider.name}`} primary onClick={() => onNotify(`Message opened with ${b.provider.name}`)} />
              <ActionButton icon="CalendarDaysIcon" label="Reschedule" onClick={() => onNotify(`Reschedule request started for ${b.ref}`)} />
              <ActionButton icon="PencilSquareIcon" label="Change details" onClick={() => onNotify('Modify request started — changes allowed up to 24 hours before')} />
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10"
              >
                <Icon name="XCircleIcon" size={18} /> Cancel booking
              </button>
            </div>
          </>
        )}

        {open && confirming && (
          <div role="alertdialog" aria-labelledby="cancel-title" aria-describedby="cancel-desc" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p id="cancel-title" className="text-sm font-bold text-foreground">
              Cancel this booking?
            </p>
            <p id="cancel-desc" className="mt-1 text-sm text-muted-foreground">
              {b.service} on {b.dateLabel}, {b.timeWindow}. Your pro will be notified. This can&apos;t be undone.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirming(false)}
                className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground hover:bg-muted"
              >
                Keep booking
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  onCancel();
                }}
                className="min-h-11 rounded-lg bg-destructive px-3 text-sm font-bold text-destructive-foreground hover:opacity-90"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        )}

        {status === 'Completed' && (
          <div className="mt-4 space-y-2">
            <ActionButton icon="StarIcon" label={`Rate ${b.provider.name}`} primary onClick={() => onNotify('Thanks! Rating opens here')} />
            <ActionButton icon="DocumentTextIcon" label="Email receipt" onClick={() => onNotify(`Receipt for ${b.ref} sent to your email`)} />
            <BookAgain />
          </div>
        )}

        {status === 'Cancelled' && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">This booking was cancelled.</p>
            <BookAgain />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Estimate</span>
          <span className="tabular text-xl font-extrabold text-foreground">From {startingPrice[b.service]}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Your pro confirms the final price before the job starts.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-sm font-bold text-foreground">Need help?</p>
        <a
          href={PHONE_PRIMARY.href}
          className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-strong hover:underline"
        >
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

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  primary?: boolean;
}

function ActionButton({ icon, label, onClick, primary }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors ${
        primary
          ? 'bg-primary text-primary-foreground hover:opacity-90'
          : 'border border-border text-foreground hover:bg-muted'
      }`}
    >
      <Icon name={icon} size={18} /> {label}
    </button>
  );
}

function BookAgain() {
  return (
    <Link
      href="/book-service"
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted"
    >
      <Icon name="ArrowPathIcon" size={18} /> Book again
    </Link>
  );
}
