'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import SectionCard from '@/app/book-service/components/SectionCard';
import { qs, useApi } from '@/app/lib/api/client';
import type { ApiAvailability } from '@/app/lib/api/types';
import type { ServiceTypeId } from '@/app/lib/catalog';

interface DateTimeSectionProps {
  service: ServiceTypeId;
  zip: string; // job (origin) ZIP: availability depends on who serves it
  date: string;
  onDate: (v: string) => void;
  slot: string; // "HH:MM" or ""
  onSlot: (v: string) => void;
}

const REASON: Record<string, string> = {
  past: 'Too soon',
  blocked: 'Unavailable',
  full: 'Already booked',
  no_providers: 'No pros available',
  out_of_range: 'Outside booking window',
};

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Real slots from GET /availability for this service, ZIP and date.
export default function DateTimeSection({ service, zip, date, onDate, slot, onSlot }: DateTimeSectionProps) {
  const ready = /^\d{5}$/.test(zip) && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const { data, error, loading } = useApi<ApiAvailability>(ready ? `/availability${qs({ service, zip, date })}` : null);
  const slots = data?.slots ?? [];
  const selected = slots.find((s) => s.time === slot);
  const selectedGone = !loading && !!slot && !!selected && !selected.available;

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
            onFocus={(e) => (e.currentTarget.min = todayLocal())}
            onChange={(e) => onDate(e.target.value)}
            className="h-12 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <div className="mt-4 flex gap-3 rounded-lg bg-info/10 p-4 text-xs text-muted-foreground">
            <Icon name="InformationCircleIcon" size={18} className="shrink-0 text-muted-foreground" />
            <p>
              {data
                ? `Times shown are for ${data.area}. Times another customer has booked aren't available. Your pro confirms the exact arrival window after you book.`
                : 'Available times depend on the service and your ZIP code. Your pro confirms the exact arrival window after you book.'}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Available time slots</p>
          {!ready && <p className="rounded-lg bg-muted px-3 py-6 text-center text-sm text-muted-foreground">Enter the job ZIP code and a date to see times.</p>}
          {ready && error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-6 text-center text-sm font-medium text-destructive">
              {error.message}
            </p>
          )}
          {ready && !error && (
            <div className="grid grid-cols-3 gap-3" aria-busy={loading}>
              {(slots.length ? slots : PLACEHOLDER).map((s) => {
                const active = slot === s.time;
                const disabled = loading || !s.available;
                return (
                  <button
                    key={s.time}
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    title={!s.available && s.reason ? REASON[s.reason] : undefined}
                    onClick={() => onSlot(s.time)}
                    className={`tabular rounded-lg border px-2 py-3 text-xs font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground/60 ${
                      active ? 'border-accent bg-accent/10 text-accent-strong' : 'border-border bg-card text-foreground hover:border-accent/50'
                    } ${loading ? 'animate-pulse' : ''}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
          {selectedGone && (
            <p role="alert" className="mt-3 text-xs font-medium text-destructive">
              That time is no longer available. Please pick another.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// Shown greyed out while the first response loads, so the layout doesn't jump.
const PLACEHOLDER = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((t) => {
  const h = Number(t.slice(0, 2));
  return { time: t, label: `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`, available: false, reason: undefined as string | undefined };
});
