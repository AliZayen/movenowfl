'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/app/components/ui/AppLogo';
import Icon from '@/app/components/ui/AppIcon';
import { useSession } from '@/app/components/SessionProvider';
import { STAFF_ROLE_LABELS, type Permission } from '@/app/lib/staff';

const NAV: { href: string; label: string; icon: string; permission: Permission }[] = [
  { href: '/admin', label: 'Overview', icon: 'Squares2X2Icon', permission: 'overview.view' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'CalendarDaysIcon', permission: 'bookings.view' },
  { href: '/admin/providers', label: 'Providers', icon: 'WrenchScrewdriverIcon', permission: 'providers.view' },
  { href: '/admin/customers', label: 'Customers', icon: 'UsersIcon', permission: 'customers.view' },
  { href: '/messages', label: 'Support inbox', icon: 'ChatBubbleLeftRightIcon', permission: 'support.reply' },
  { href: '/admin/availability', label: 'Availability', icon: 'NoSymbolIcon', permission: 'availability.manage' },
  { href: '/admin/staff', label: 'Staff', icon: 'ShieldCheckIcon', permission: 'staff.manage' },
  { href: '/admin/audit', label: 'Audit log', icon: 'DocumentMagnifyingGlassIcon', permission: 'audit.view' },
];

// Frame for every admin page: a sidebar showing only what this staff member may open.
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useSession();
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const allowed = new Set(user?.permissions ?? []);
  const items = NAV.filter((n) => allowed.has(n.permission));
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const role = user?.staffRole ? STAFF_ROLE_LABELS[user.staffRole].label : '';

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          aria-current={active(n.href) ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
            active(n.href) ? 'bg-accent/10 text-accent-strong' : 'text-primary hover:bg-secondary'
          }`}
        >
          <Icon name={n.icon} size={19} /> {n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <AppLogo size={34} />
          <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{nav}</div>
        <StaffCard name={user?.fullName || user?.email || ''} role={role} onSignOut={() => signOut('/signin')} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <AppLogo size={30} />
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Admin</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Admin menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-primary hover:bg-secondary"
          >
            <Icon name={open ? 'XMarkIcon' : 'Bars3Icon'} size={22} />
          </button>
        </header>
        {open && (
          <div className="border-b border-border bg-card p-3 lg:hidden">
            {nav}
            <StaffCard name={user?.fullName || user?.email || ''} role={role} onSignOut={() => signOut('/signin')} />
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function StaffCard({ name, role, onSignOut }: { name: string; role: string; onSignOut: () => void }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2 border-t border-border p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{role} · session ends after 8 h</p>
      </div>
      <button type="button" onClick={onSignOut} aria-label="Sign out" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive">
        <Icon name="ArrowRightOnRectangleIcon" size={19} />
      </button>
    </div>
  );
}
