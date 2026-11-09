'use client';

import React from 'react';
import Link from 'next/link';
import PartyAvatar from '@/app/components/ui/PartyAvatar';
import { shortTime, useConversations } from '@/app/lib/api/messaging';

// Read-only preview of the latest conversations. Replies happen inside the conversation,
// so a message can never go to the wrong provider from here.
export default function RecentMessages() {
  const { data, error, reload } = useConversations(4);
  const items = data?.items;

  return (
    <section aria-labelledby="recent-messages-title" className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 id="recent-messages-title" className="text-lg font-extrabold text-foreground">
          Recent Messages
        </h2>
        {items && items.length > 0 && (
          <Link href="/messages" className="text-sm font-bold text-accent-strong hover:underline">
            View all
          </Link>
        )}
      </div>

      {!items && !error && (
        <ul aria-label="Loading messages" className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 py-1">
              <span className="h-11 w-11 animate-pulse rounded-full bg-muted" />
              <span className="h-3 flex-1 animate-pulse rounded bg-muted" />
            </li>
          ))}
        </ul>
      )}

      {error && !items && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Couldn&apos;t load messages.{' '}
          <button type="button" onClick={reload} className="font-bold underline">
            Try again
          </button>
        </p>
      )}

      {items && items.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No messages yet. Open a booking and tap “Message” to talk to your pro.
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="mt-3 flex-1 divide-y divide-border">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                aria-label={`Open conversation with ${c.otherParty.name}${c.unreadCount ? `, ${c.unreadCount} unread` : ''}`}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <PartyAvatar party={c.otherParty} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{c.otherParty.name}</p>
                    <span className="tabular shrink-0 text-xs text-muted-foreground">{shortTime(c.lastMessageAt)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className={`truncate text-[13px] ${c.unreadCount ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      {c.lastMessageMine && 'You: '}
                      {c.lastMessagePreview}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-strong px-1.5 text-[11px] font-bold text-accent-foreground">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
