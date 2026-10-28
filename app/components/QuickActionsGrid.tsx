'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';

interface QuickActionsGridProps {
  onBook?: () => void;
  compact?: boolean;
}

const actions = [
  {
    id: 'qa-book',
    title: 'Book a Service',
    sub: 'Moving, assembly, TV mounting...',
    icon: 'TruckIcon',
    href: '/book-service' as string | null,
  },
  {
    id: 'qa-bookings',
    title: 'View My Bookings',
    sub: 'Check status & details',
    icon: 'CalendarDaysIcon',
    href: '/my-bookings',
  },
  {
    id: 'qa-messages',
    title: 'Messages',
    sub: 'Contact your service providers',
    icon: 'ChatBubbleOvalLeftEllipsisIcon',
    href: '/',
  },
  {
    id: 'qa-profile',
    title: 'Profile & Settings',
    sub: 'Manage your account',
    icon: 'UserIcon',
    href: '/profile',
  },
];

export default function QuickActionsGrid({ onBook, compact = false }: QuickActionsGridProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="text-lg font-extrabold text-foreground">Quick Actions</h2>
      <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {actions.map((a) => {
          const inner = (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon name={a.icon} size={22} />
              </span>
              <span className="mt-3 block text-sm font-bold text-foreground">{a.title}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{a.sub}</span>
              <Icon
                name="ChevronRightIcon"
                size={16}
                className="absolute bottom-3 right-3 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </>
          );
          const cls =
            'group relative block rounded-xl border border-border bg-card p-4 pb-5 text-left transition-all duration-150 hover:border-accent/50 hover:shadow-soft active:scale-[0.98]';
          return a.href ? (
            <Link key={a.id} href={a.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={a.id} type="button" onClick={onBook} className={cls}>
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}