'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/app/components/ui/AppIcon';

const navItems = [
  { id: 'nav-dashboard', label: 'Dashboard', href: '/dashboard', icon: 'HomeIcon' },
  { id: 'nav-bookings', label: 'My Bookings', href: '/my-bookings', icon: 'CalendarDaysIcon' },
  { id: 'nav-messages', label: 'Messages', href: '/', icon: 'ChatBubbleOvalLeftEllipsisIcon', badge: 2 },
  { id: 'nav-profile', label: 'Profile & Settings', href: '/profile', icon: 'UserIcon' },
];

export default function NavTabs() {
  const pathname = usePathname();

  const isActive = (id: string, href: string) => {
    if (id === 'nav-dashboard') return pathname === '/dashboard' || pathname.startsWith('/book-service');
    if (id === 'nav-bookings') return pathname.startsWith('/my-bookings');
    if (id === 'nav-profile') return pathname.startsWith('/profile');
    return false;
  };

  return (
    <nav
      aria-label="Primary"
      className="scrollbar-hide flex gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 2xl:px-16"
    >
      {navItems.map((item) => {
        const active = isActive(item.id, item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors duration-150 ${
              active ? 'text-accent' : 'text-primary hover:text-accent'
            }`}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
            {item.badge ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                {item.badge}
              </span>
            ) : null}
            <span
              className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent transition-all duration-200 ${
                active ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}