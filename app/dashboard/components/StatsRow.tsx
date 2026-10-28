import React from 'react';
import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';

export interface BookingCounts {
  upcoming: number;
  pending: number;
  completed: number;
  total: number;
}

interface StatsRowProps {
  counts: BookingCounts;
}

export default function StatsRow({ counts }: StatsRowProps) {
  // Each card opens the list it counts.
  const stats = [
    { id: 'stat-upcoming', label: 'Upcoming', value: counts.upcoming, icon: 'CalendarDaysIcon', tone: 'bg-accent/10 text-accent-strong', href: '#upcoming' },
    { id: 'stat-pending', label: 'Pending', value: counts.pending, icon: 'ClockIcon', tone: 'bg-warning/10 text-warning', href: '/my-bookings?status=Pending' },
    { id: 'stat-completed', label: 'Completed', value: counts.completed, icon: 'CheckCircleIcon', tone: 'bg-success/10 text-success', href: '/my-bookings?status=Completed' },
    { id: 'stat-total', label: 'Total', value: counts.total, icon: 'Squares2X2Icon', tone: 'bg-primary/10 text-primary', href: '/my-bookings' },
  ];

  return (
    <section aria-label="Booking summary" className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <Link
          key={s.id}
          href={s.href}
          aria-label={`${s.value} ${s.label.toLowerCase()} bookings, view list`}
          className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow duration-150 hover:shadow-pop"
        >
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${s.tone}`}>
              <Icon name={s.icon} size={20} />
            </span>
            <p className="text-sm font-bold text-foreground">{s.label}</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <p className="tabular text-3xl font-extrabold text-foreground">{s.value}</p>
            <Icon
              name="ArrowRightIcon"
              size={18}
              className="mb-1 text-accent-strong transition-transform duration-150 group-hover:translate-x-1"
            />
          </div>
        </Link>
      ))}
    </section>
  );
}
