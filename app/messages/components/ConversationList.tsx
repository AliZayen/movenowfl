'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';
import PartyAvatar from '@/app/components/ui/PartyAvatar';
import { shortTime } from '@/app/lib/api/messaging';
import type { ApiConversation } from '@/app/lib/api/types';

interface ConversationListProps {
  items?: ApiConversation[];
  loading: boolean;
  error?: string;
  onRetry: () => void;
  selectedId: string | null;
}

export default function ConversationList({ items, loading, error, onRetry, selectedId }: ConversationListProps) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items ?? [];
    return (items ?? []).filter((c) =>
      [c.otherParty.name, c.booking?.ref, c.booking?.serviceLabel, c.lastMessagePreview].some((v) => v?.toLowerCase().includes(term)),
    );
  }, [items, q]);

  return (
    <>
      <div className="border-b border-border p-3">
        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <Icon name="MagnifyingGlassIcon" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or booking"
            className="h-10 w-full rounded-lg border border-border bg-input pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <ListSkeleton />}

        {error && !items && (
          <div role="alert" className="p-5 text-center text-sm">
            <p className="text-destructive">{error}</p>
            <button type="button" onClick={onRetry} className="mt-2 font-bold text-accent-strong hover:underline">
              Try again
            </button>
          </div>
        )}

        {items && items.length === 0 && (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-strong">
              <Icon name="ChatBubbleOvalLeftEllipsisIcon" size={24} />
            </span>
            <p className="mt-3 text-sm font-bold text-foreground">No messages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Open a booking and tap “Message” to talk to your pro.</p>
            <Link href="/my-bookings" className="mt-4 rounded-lg bg-accent-strong px-4 py-2 text-sm font-bold text-accent-foreground hover:opacity-90">
              Go to My Bookings
            </Link>
          </div>
        )}

        {items && items.length > 0 && filtered.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No conversations match “{q.trim()}”.</p>
        )}

        <ul className="divide-y divide-border">
          {filtered.map((c) => {
            const active = c.id === selectedId;
            const unread = c.unreadCount > 0 && !active;
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={`${c.otherParty.name}${c.booking ? `, ${c.booking.serviceLabel} ${c.booking.ref}` : ''}${unread ? `, ${c.unreadCount} unread` : ''}`}
                  className={`relative flex items-center gap-3 px-4 py-3.5 transition-colors ${active ? 'bg-accent/5' : 'hover:bg-muted'}`}
                >
                  {active && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-accent" />}
                  <PartyAvatar party={c.otherParty} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${unread ? 'font-extrabold' : 'font-bold'} text-foreground`}>{c.otherParty.name}</p>
                      <span className={`tabular shrink-0 text-xs ${unread ? 'font-bold text-accent-strong' : 'text-muted-foreground'}`}>
                        {shortTime(c.lastMessageAt)}
                      </span>
                    </div>
                    {c.booking && (
                      <p className="truncate text-xs text-muted-foreground">
                        {c.booking.serviceLabel} · {c.booking.ref}
                      </p>
                    )}
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-[13px] ${unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {c.lastMessageMine && 'You: '}
                        {c.lastMessagePreview}
                      </p>
                      {unread && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-strong px-1.5 text-[11px] font-bold text-accent-foreground">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <ul aria-label="Loading conversations" className="divide-y divide-border">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3.5">
          <span className="h-11 w-11 animate-pulse rounded-full bg-muted" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-1/2 animate-pulse rounded bg-muted" />
            <span className="block h-3 w-3/4 animate-pulse rounded bg-muted" />
          </span>
        </li>
      ))}
    </ul>
  );
}
