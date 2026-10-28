import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import type { Booking, BookingStatus } from '@/app/data/mockData';

interface BookingProgressProps {
  status: BookingStatus;
  booking: Booking;
}

// How far each status gets through the steps. TODO: use booking_events timestamps from the API.
const reached: Record<BookingStatus, number> = {
  Pending: 1,
  Confirmed: 2,
  Completed: 4,
  Cancelled: 1,
};

export default function BookingProgress({ status, booking }: BookingProgressProps) {
  const steps = [
    { id: 'submitted', title: 'Request submitted', desc: 'We received your booking request.' },
    { id: 'confirmed', title: 'Confirmed', desc: 'Your pro and arrival window are locked in.' },
    { id: 'service', title: 'Service day', desc: `${booking.dateLabel} · ${booking.timeWindow}` },
    { id: 'completed', title: 'Completed', desc: 'Rate your experience after the service.' },
  ];
  const done = reached[status];
  const cancelled = status === 'Cancelled';

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="mb-4 text-base font-bold text-foreground">Booking Progress</h2>
      {cancelled && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
          This booking was cancelled.
        </p>
      )}
      <ol>
        {steps.map((s, i) => {
          const isDone = i < done;
          const isCurrent = !cancelled && i === done;
          return (
            <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
              {i < steps.length - 1 && (
                <span
                  className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 ${i < done - 1 ? 'bg-success' : 'bg-border'}`}
                />
              )}
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isDone
                    ? 'bg-success text-success-foreground'
                    : isCurrent
                      ? 'border-2 border-accent-strong bg-card text-accent-strong'
                      : 'border border-border bg-card text-muted-foreground'
                }`}
              >
                {isDone ? <Icon name="CheckIcon" size={14} /> : i + 1}
              </span>
              <div className={cancelled && !isDone ? 'opacity-50' : ''}>
                <p className="text-sm font-semibold text-foreground">
                  {s.title}
                  {isCurrent && <span className="ml-2 text-xs font-semibold text-accent-strong">Next</span>}
                </p>
                <p className="tabular text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
