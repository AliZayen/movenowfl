'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/app/components/ui/AppLogo';
import Icon from '@/app/components/ui/AppIcon';
import Avatar from '@/app/components/ui/Avatar';
import { useSession } from '@/app/components/SessionProvider';
import { initials } from '@/app/lib/api/format';

// TODO: notifications have no backend yet (README phase 4); these are placeholders.
const notifications = [
  { id: 'notif-1', text: 'Mike Rodriguez confirmed your Jun 18 moving', time: '2h ago', unread: true },
  { id: 'notif-2', text: 'Sarah Johnson sent you a message', time: '3h ago', unread: true },
  { id: 'notif-3', text: 'Your TV mounting is awaiting confirmation', time: 'Yesterday', unread: false },
];

export default function Topbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useSession();
  const router = useRouter();

  const name = user?.fullName || user?.email || '';
  const role = user?.role === 'admin' ? 'Admin' : user?.role === 'provider' ? 'Pro' : 'Client';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    const base = user?.role === 'provider' ? '/pro?tab=all' : user?.role === 'admin' ? '/admin/bookings' : '/my-bookings';
    router.push(q ? `${base}${base.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}` : base);
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut('/');
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8 2xl:px-16">
      <Link href={user?.role === 'provider' ? '/pro' : user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2" aria-label="MoveNow Miami home">
        <AppLogo size={44} />
      </Link>

      <form role="search" onSubmit={search} className="order-last w-full md:order-none md:mx-auto md:w-auto md:flex-1 md:max-w-2xl">
        <label className="relative block">
          <span className="sr-only">Search by service, reference or address</span>
          <Icon
            name="MagnifyingGlassIcon"
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by service, reference # or address..."
            className="h-11 w-full rounded-xl border border-border bg-secondary pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </label>
      </form>

      <div className="ml-auto flex items-center gap-3">
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-150 hover:bg-secondary active:scale-95"
          >
            <Icon name="BellIcon" size={22} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-pop">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-foreground">Notifications</p>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent-strong">2 new</span>
              </div>
              <ul>
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/50">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? 'bg-accent' : 'bg-border'}`} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{n.text}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-label="Account menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-secondary"
          >
            {user?.avatarUrl ? (
              <Avatar src={user.avatarUrl} alt="" size={44} />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {name ? initials(name) : ''}
              </span>
            )}
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-40 truncate text-sm font-bold text-foreground">{name}</span>
              <span className="block text-xs text-muted-foreground">{role}</span>
            </span>
            <Icon
              name="ChevronDownIcon"
              size={16}
              className={`text-muted-foreground transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-14 z-40 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-pop">
              {!!user?.permissions.length && (
                <Link href="/admin" className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-semibold text-accent-strong hover:bg-muted/60">
                  <Icon name="ShieldCheckIcon" size={16} /> Admin area
                </Link>
              )}
              <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60">
                <Icon name="UserIcon" size={16} /> Profile &amp; Settings
              </Link>
              {user?.role === 'customer' && (
                <Link href="/my-bookings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60">
                  <Icon name="CalendarDaysIcon" size={16} /> My Bookings
                </Link>
              )}
              {user?.role === 'provider' && (
                <Link href="/pro" className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60">
                  <Icon name="BriefcaseIcon" size={16} /> My Jobs
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/60"
              >
                <Icon name="ArrowRightOnRectangleIcon" size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
