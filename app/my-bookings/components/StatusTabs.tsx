import React from 'react';

export type TabKey = 'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

interface StatusTabsProps {
  active: TabKey;
  counts: Record<TabKey, number>;
  onChange: (t: TabKey) => void;
}

const tabs: { key: TabKey; countTone: string }[] = [
  { key: 'All', countTone: 'bg-accent text-accent-foreground' },
  { key: 'Pending', countTone: 'bg-warning/10 text-warning' },
  { key: 'Confirmed', countTone: 'bg-success/10 text-success' },
  { key: 'Completed', countTone: 'bg-info/10 text-info' },
  { key: 'Cancelled', countTone: 'bg-muted text-muted-foreground' },
];

export default function StatusTabs({ active, counts, onChange }: StatusTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter bookings by status"
      className="scrollbar-hide flex items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-soft"
    >
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={`tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={`relative flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
              isActive ? 'bg-accent/5 text-accent' : 'text-primary hover:bg-muted/60'
            }`}
          >
            {t.key}
            <span
              className={`tabular flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${t.countTone}`}
            >
              {counts[t.key]}
            </span>
            <span
              className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent transition-opacity duration-200 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}