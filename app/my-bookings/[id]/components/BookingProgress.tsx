import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface BookingProgressProps {
  cancelled: boolean;
}

const steps = [
  { id: 'step-1', title: 'Request submitted', desc: 'We received your booking request.', time: 'Oct 29, 2026 • 10:24 AM', done: true },
  { id: 'step-2', title: 'Agent confirmed', desc: 'Crew and arrival window locked in.', time: 'Oct 29, 2026 • 11:03 AM', done: true },
  { id: 'step-3', title: 'Service day', desc: 'Oct 29, 2026 • 2:00 PM – 4:00 PM', time: 'Oct 29, 2026 • 2:00 PM – 4:00 PM', done: true },
  { id: 'step-4', title: 'Completed', desc: 'Rate your experience after service.', time: 'Pending', done: false },
];

export default function BookingProgress({ cancelled }: BookingProgressProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="mb-4 text-base font-bold text-foreground">Booking Progress</h2>
      {cancelled && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          This booking has been cancelled.
        </p>
      )}
      <ol>
        {steps.map((s, i) => (
          <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 ${s.done ? 'bg-success' : 'bg-border'}`} />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                s.done ? 'bg-success text-success-foreground' : 'border border-border bg-card text-muted-foreground'
              }`}
            >
              {s.done ? <Icon name="CheckIcon" size={14} /> : i + 1}
            </span>
            <div className="flex flex-1 flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="tabular text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <p className="tabular text-xs text-muted-foreground">{s.time}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
