'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface DetailsSidebarProps {
  service: string;
  cancelled: boolean;
  onCancel: () => void;
  onModify: () => void;
  onNotify: (msg: string) => void;
  onProfile: () => void;
}

const summaryRows = [
  { id: 's-1', icon: 'WrenchScrewdriverIcon', label: 'Service type', value: 'TV Mounting' },
  { id: 's-2', icon: 'CalendarDaysIcon', label: 'Date', value: 'Oct 29, 2026' },
  { id: 's-3', icon: 'ClockIcon', label: 'Time', value: '2:00 PM – 4:00 PM' },
  { id: 's-4', icon: 'ClockIcon', label: 'Duration', value: '1.5 hours' },
  { id: 's-5', icon: 'MapPinIcon', label: 'Address', value: '456 Brickell Ave, Miami, FL, 33131' },
];

export default function DetailsSidebar({ cancelled, onCancel, onModify, onNotify, onProfile }: DetailsSidebarProps) {
  const quick = [
    { id: 'q-1', icon: 'ChatBubbleOvalLeftEllipsisIcon', title: 'Message the provider', desc: 'Ask a question or share details', run: () => onNotify('Message opened with Mike Rodriguez') },
    { id: 'q-2', icon: 'PhoneIcon', title: 'Call the provider', desc: '+1 (305) 555-0123', run: () => onNotify('Calling +1 (305) 555-0123…') },
    { id: 'q-3', icon: 'UserIcon', title: 'View provider profile', desc: 'See ratings and reviews', run: onProfile },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-3 text-base font-bold text-foreground">
          <Icon name="ClipboardDocumentListIcon" size={22} className="text-primary" /> Booking Summary
        </h2>
        <ul className="mt-3">
          {summaryRows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 border-b border-border py-3 text-sm last:border-b-0">
              <span className="flex items-center gap-3 text-muted-foreground">
                <Icon name={r.icon} size={18} className="text-primary" /> {r.label}
              </span>
              <span className="tabular max-w-[55%] text-right font-medium text-foreground">{r.value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-accent/10 px-4 py-3">
          <span className="text-sm font-semibold text-accent">Estimated total</span>
          <span className="tabular text-xl font-extrabold text-accent">$149.00</span>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-3 text-base font-bold text-foreground">
          <Icon name="IdentificationIcon" size={22} className="text-primary" /> Customer Information
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
            JD
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">John Doe</p>
            <p className="text-xs text-muted-foreground">john@example.com</p>
            <p className="tabular text-xs text-muted-foreground">+1 (305) 555-0123</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Icon name="FireIcon" size={22} variant="solid" className="text-accent" /> Need to make a change?
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          You can modify your booking details up to 24 hours before the scheduled time.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={cancelled}
            onClick={onModify}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent py-2.5 text-xs font-bold text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
          >
            <Icon name="PencilIcon" size={14} /> Modify
          </button>
          <button
            type="button"
            disabled={cancelled}
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive py-2.5 text-xs font-bold text-destructive-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
          >
            <Icon name="XCircleIcon" size={14} /> Cancel
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-3 text-base font-bold text-foreground">
          <Icon name="BoltIcon" size={22} className="text-primary" /> Quick Actions
        </h2>
        <ul className="mt-2">
          {quick.map((q) => (
            <li key={q.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                onClick={q.run}
                className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:text-accent"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon name={q.icon} size={18} />
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-bold text-foreground">{q.title}</span>
                  <span className="tabular block text-[11px] text-muted-foreground">{q.desc}</span>
                </span>
                <Icon name="ChevronRightIcon" size={16} className="text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-info/20 bg-info/10 p-5">
        <Icon name="ShieldCheckIcon" size={26} className="shrink-0 text-primary" />
        <div>
          <p className="text-sm font-bold text-foreground">Your booking is protected</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We verify all service providers and keep your payment secure.
          </p>
        </div>
      </section>
    </div>
  );
}
