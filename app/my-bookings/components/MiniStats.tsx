import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

const stats = [
  { id: 'mini-total', value: 6, label: 'Total Bookings', icon: 'CalendarDaysIcon', tone: 'bg-accent/10 text-accent', solid: false },
  { id: 'mini-pending', value: 1, label: 'Pending', icon: 'ClockIcon', tone: 'bg-warning/10 text-warning', solid: false },
  { id: 'mini-completed', value: 3, label: 'Completed', icon: 'CheckCircleIcon', tone: 'bg-success/10 text-success', solid: true },
  { id: 'mini-cancelled', value: 0, label: 'Cancelled', icon: 'CalendarDaysIcon', tone: 'bg-accent/10 text-accent', solid: false },
];

export default function MiniStats() {
  return (
    <section
      aria-label="Booking totals"
      className="grid grid-cols-2 divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:grid-cols-4 sm:divide-x"
    >
      {stats?.map((s) => (
        <div key={s?.id} className="p-4">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${s?.tone}`}>
            <Icon name={s?.icon} size={20} variant={s?.solid ? 'solid' : 'outline'} />
          </span>
          <p className="tabular mt-2 text-2xl font-extrabold text-foreground">{s?.value}</p>
          <p className="text-xs text-muted-foreground">{s?.label}</p>
        </div>
      ))}
    </section>
  );
}