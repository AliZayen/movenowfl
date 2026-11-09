import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import { formatDate, formatDateTime, windowLabel } from '@/app/lib/api/format';
import type { ApiBookingDetail } from '@/app/lib/api/types';

// Timeline from the booking's events (README 8.5): submitted → confirmed → service day → completed.
export default function BookingProgress({ booking: b }: { booking: ApiBookingDetail }) {
  const { steps, cancelled, cancelledAt } = b.timeline;
  const desc: Record<string, string> = {
    submitted: 'We received your booking request.',
    confirmed: 'Your pro and arrival window are locked in.',
    service_day: `${formatDate(b.scheduledDate)} · ${windowLabel(b)}`,
    completed: 'Rate your experience after the service.',
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="mb-4 text-base font-bold text-foreground">Booking Progress</h2>
      {cancelled && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
          This booking was cancelled{cancelledAt ? ` on ${formatDateTime(cancelledAt)}` : ''}.
          {b.cancelReason ? ` Reason: ${b.cancelReason}` : ''}
        </p>
      )}
      <ol>
        {steps.map((s, i) => (
          <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={s.current ? 'step' : undefined}>
            {i < steps.length - 1 && (
              <span className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 ${steps[i + 1].done ? 'bg-success' : 'bg-border'}`} />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                s.done
                  ? 'bg-success text-success-foreground'
                  : s.current
                    ? 'border-2 border-accent-strong bg-card text-accent-strong'
                    : 'border border-border bg-card text-muted-foreground'
              }`}
            >
              {s.done ? <Icon name="CheckIcon" size={14} /> : i + 1}
            </span>
            <div className={`flex flex-1 flex-wrap items-start justify-between gap-2 ${cancelled && !s.done ? 'opacity-50' : ''}`}>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {s.label}
                  {s.current && <span className="ml-2 text-xs font-semibold text-accent-strong">Next</span>}
                </p>
                <p className="tabular text-sm text-muted-foreground">{desc[s.key]}</p>
              </div>
              {s.at && <p className="tabular text-xs text-muted-foreground">{formatDateTime(s.at)}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
