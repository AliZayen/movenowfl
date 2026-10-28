import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface StatsRowProps {
  onViewAll: () => void;
}

const stats = [
  { id: 'stat-upcoming', label: 'Upcoming Bookings', value: 2, icon: 'CalendarDaysIcon', tone: 'bg-accent/10 text-accent' },
  { id: 'stat-pending', label: 'Pending Requests', value: 1, icon: 'ClockIcon', tone: 'bg-warning/10 text-warning' },
  { id: 'stat-completed', label: 'Completed', value: 3, icon: 'CheckCircleIcon', tone: 'bg-primary text-primary-foreground' },
  { id: 'stat-total', label: 'Total Bookings', value: 6, icon: 'CalendarDaysIcon', tone: 'bg-accent/10 text-accent' },
];

export default function StatsRow({ onViewAll }: StatsRowProps) {
  return (
    <section aria-label="Booking summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.id}
          className={`rounded-2xl border bg-card p-4 shadow-soft transition-shadow duration-150 hover:shadow-pop ${
            s.id === 'stat-pending' ? 'border-warning/40' : 'border-border'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${s.tone}`}>
              <Icon name={s.icon} size={22} variant={s.id === 'stat-completed' ? 'solid' : 'outline'} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-tight text-foreground">{s.label}</p>
              <p className="tabular mt-1 text-3xl font-extrabold text-foreground">{s.value}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-accent transition-all duration-150 hover:gap-2.5"
          >
            View all <Icon name="ArrowRightIcon" size={16} />
          </button>
        </div>
      ))}
    </section>
  );
}