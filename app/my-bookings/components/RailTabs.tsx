'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Avatar from '@/app/components/ui/Avatar';
import Icon from '@/app/components/ui/AppIcon';
import StatusBadge from '@/app/components/ui/StatusBadge';
import { bookings, initialMessages } from '@/app/data/mockData';

type RailKey = 'messages' | 'upcoming' | 'actions';

const tabs: { key: RailKey; label: string }[] = [
  { key: 'messages', label: 'Recent Messages' },
  { key: 'upcoming', label: 'Upcoming Bookings' },
  { key: 'actions', label: 'Quick Actions' },
];

const shortcuts = [
  { id: 'short-book', label: 'Book a Service', sub: 'Moving, assembly, TV mounting', icon: 'TruckIcon', href: '/my-bookings' },
  { id: 'short-bookings', label: 'View My Bookings', sub: 'Check status & details', icon: 'CalendarDaysIcon', href: '/my-bookings' },
  { id: 'short-dash', label: 'Back to Dashboard', sub: 'Overview of everything', icon: 'HomeIcon', href: '/' },
];

export default function RailTabs() {
  const [active, setActive] = useState<RailKey>('messages');
  const upcoming = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending');

  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <div role="tablist" className="flex border-b border-border px-2">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={`rail-${t.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.key)}
              className={`relative flex-1 px-2 py-3.5 text-xs font-bold transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {t.label}
              <span
                className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent transition-opacity duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="p-3">
        {active === 'messages' && (
          <div>
            <ul className="divide-y divide-border">
              {initialMessages.map((m) => (
                <li key={`rm-${m.id}`} className="flex items-center gap-3 px-2 py-3">
                  <Avatar src={m.avatar} alt={m.avatarAlt} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-foreground">{m.name}</p>
                      <span className="tabular shrink-0 text-[11px] text-muted-foreground">{m.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">{m.preview}</p>
                      {m.unread > 0 && (
                        <span className="tabular flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                          {m.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-muted/70 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-muted"
            >
              <Icon name="ChatBubbleOvalLeftEllipsisIcon" size={14} /> View all messages
              <Icon name="ArrowRightIcon" size={14} />
            </button>
          </div>
        )}

        {active === 'upcoming' && (
          <ul className="space-y-2">
            {upcoming.map((b) => (
              <li key={`ru-${b.id}`} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{b.service}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="tabular mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="CalendarDaysIcon" size={13} />
                  {b.dateLabel} • {b.timeWindow}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="MapPinIcon" size={13} />
                  <span className="truncate">{b.address}</span>
                </p>
              </li>
            ))}
          </ul>
        )}

        {active === 'actions' && (
          <ul className="space-y-2">
            {shortcuts.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all duration-150 hover:border-accent/50 hover:shadow-soft"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon name={s.icon} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-foreground">{s.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{s.sub}</span>
                  </span>
                  <Icon name="ChevronRightIcon" size={16} className="text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}