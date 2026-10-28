import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import { dateRanges } from '@/app/data/mockData';

interface BookingsHeaderProps {
  query: string;
  onQuery: (v: string) => void;
  rangeId: string;
  onRange: (v: string) => void;
}

export default function BookingsHeader({ query, onQuery, rangeId, onRange }: BookingsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-accent shadow-soft">
          <Icon name="CalendarDaysIcon" size={28} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage and track all your service requests.</p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 lg:w-96">
        <label className="relative block">
          <span className="sr-only">Search bookings</span>
          <Icon
            name="MagnifyingGlassIcon"
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search by service, reference # or address..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </label>
        <label className="relative block lg:ml-auto lg:w-60">
          <span className="sr-only">Date range</span>
          <Icon
            name="CalendarDaysIcon"
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary"
          />
          <select
            value={rangeId}
            onChange={(e) => onRange(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-border bg-card pl-10 pr-9 text-sm font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            {dateRanges.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDownIcon"
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </label>
      </div>
    </div>
  );
}