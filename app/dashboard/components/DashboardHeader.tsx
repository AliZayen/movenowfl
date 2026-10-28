import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface DashboardHeaderProps {
  name: string;
  upcomingCount: number;
  onBook: () => void;
}

export default function DashboardHeader({ name, upcomingCount, onBook }: DashboardHeaderProps) {
  const summary =
    upcomingCount === 0
      ? 'You have no upcoming bookings.'
      : `You have ${upcomingCount} upcoming booking${upcomingCount === 1 ? '' : 's'}.`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">
          Welcome back, {name}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      </div>
      <button
        type="button"
        onClick={onBook}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-strong px-5 text-sm font-bold text-accent-foreground shadow-soft transition-opacity hover:opacity-90"
      >
        <Icon name="PlusIcon" size={18} /> Book a New Service
      </button>
    </div>
  );
}
