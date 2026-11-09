'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/app/components/ui/AppIcon';
import { useSession } from '@/app/components/SessionProvider';
import { useUnreadCount } from '@/app/lib/api/messaging';

const customerItems = [
  { id: 'nav-dashboard', label: 'Dashboard', href: '/dashboard', icon: 'HomeIcon' },
  { id: 'nav-bookings', label: 'My Bookings', href: '/my-bookings', icon: 'CalendarDaysIcon' },
  { id: 'nav-messages', label: 'Messages', href: '/messages', icon: 'ChatBubbleOvalLeftEllipsisIcon' },
  { id: 'nav-profile', label: 'Profile & Settings', href: '/profile', icon: 'UserIcon' },
];

// Pros (role = provider) work in /pro: their assigned jobs and those jobs' conversations.
const providerItems = [
  { id: 'nav-jobs', label: 'My Jobs', href: '/pro', icon: 'BriefcaseIcon' },
  { id: 'nav-messages', label: 'Messages', href: '/messages', icon: 'ChatBubbleOvalLeftEllipsisIcon' },
  { id: 'nav-profile', label: 'Profile & Settings', href: '/profile', icon: 'UserIcon' },
];

// Staff only see the shared pages here (the support inbox and their profile); their work is in /admin.
const adminItems = [
  { id: 'nav-admin', label: 'Admin', href: '/admin', icon: 'ShieldCheckIcon' },
  { id: 'nav-messages', label: 'Messages', href: '/messages', icon: 'ChatBubbleOvalLeftEllipsisIcon' },
  { id: 'nav-profile', label: 'Profile & Settings', href: '/profile', icon: 'UserIcon' },
];

const ITEMS = { customer: customerItems, provider: providerItems, admin: adminItems };

// Reads the URL, so AppLayout renders it inside <Suspense> with NavTabsView as the fallback.
export default function NavTabs() {
  const { status, user } = useSession();
  const unread = useUnreadCount(status === 'authenticated');
  return <NavTabsView pathname={usePathname()} unread={unread} role={user?.role} />;
}

export function NavTabsView({ pathname, unread = 0, role = 'customer' }: { pathname: string | null; unread?: number; role?: keyof typeof ITEMS }) {
  const navItems = ITEMS[role];
  const isActive = (id: string) => {
    if (!pathname) return false;
    if (id === 'nav-jobs') return pathname.startsWith('/pro');
    if (id === 'nav-admin') return pathname.startsWith('/admin');
    if (id === 'nav-dashboard') return pathname === '/dashboard' || pathname.startsWith('/book-service');
    if (id === 'nav-bookings') return pathname.startsWith('/my-bookings');
    if (id === 'nav-messages') return pathname.startsWith('/messages');
    if (id === 'nav-profile') return pathname.startsWith('/profile');
    return false;
  };

  // On phones the tabs scroll sideways; the right-edge fade shows there is more.
  return (
    <nav
      aria-label="Primary"
      className="scrollbar-hide flex gap-1 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,black_80%,transparent)] sm:px-6 sm:[mask-image:none] lg:px-8 2xl:px-16"
    >
      {navItems.map((item) => {
        const active = isActive(item.id);
        const badge = item.id === 'nav-messages' ? unread : 0;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors duration-150 ${
              active ? 'text-accent-strong' : 'text-primary hover:text-accent-strong'
            }`}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
            {badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-strong px-1.5 text-[11px] font-bold text-accent-foreground">
                <span aria-hidden>{badge > 99 ? '99+' : badge}</span>
                <span className="sr-only">, {badge} unread</span>
              </span>
            )}
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