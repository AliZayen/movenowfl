'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import SectionCard from '@/app/book-service/components/SectionCard';

interface DateTimeSectionProps {
  date: string;
  onDate: (v: string) => void;
  slot: string;
  onSlot: (v: string) => void;
}

const slots = [
  { time: '8:00 AM', disabled: false },
  { time: '9:00 AM', disabled: false },
  { time: '10:00 AM', disabled: false },
  { time: '11:00 AM', disabled: false },
  { time: '12:00 PM', disabled: false },
  { time: '1:00 PM', disabled: false },
  { time: '2:00 PM', disabled: true },
  { time: '3:00 PM', disabled: false },
  { time: '4:00 PM', disabled: false },
  { time: '5:00 PM', disabled: false },
  { time: '6:00 PM', disabled: false },
  { time: '7:00 PM', disabled: false },
];

export default function DateTimeSection({ date, onDate, slot, onSlot }: DateTimeSectionProps) {
  return (
    <SectionCard step={3} icon="CalendarDaysIcon" title="Date & Time" subtitle="Choose your preferred date and time slot.">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="pref-date" className="mb-2 block text-sm font-semibold text-foreground">
            Preferred date
          </label>
          <input
            id="pref-date"
            type="date"
            value={date}
            onChange={(e) => onDate(e.target.value)}
            className="h-12 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <div className="mt-4 flex gap-3 rounded-lg bg-info/10 p-4 text-xs text-muted-foreground">
            <Icon name="InformationCircleIcon" size={18} className="shrink-0 text-muted-foreground" />
            <p>
              Available times may vary based on the service and location. You&apos;ll be able to confirm the exact
              time in the next step.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Available time slots</p>
          <div className="grid grid-cols-3 gap-3">
            {slots.map((s) => {
              const active = slot === s.time;
              return (
                <button
                  key={s.time}
                  type="button"
                  disabled={s.disabled}
                  aria-pressed={active}
                  onClick={() => onSlot(s.time)}
                  className={`tabular rounded-lg border px-2 py-3 text-xs font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground/60 ${
                    active
                      ? 'border-accent bg-accent/10 text-accent' :'border-border bg-card text-foreground hover:border-accent/50'
                  }`}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
