'use client';

import React, { useState } from 'react';
import Avatar from '@/app/components/ui/Avatar';
import { initialMessages, Message } from '@/app/data/mockData';

interface RecentMessagesProps {
  onNotify: (msg: string) => void;
}

// Read-only preview. Replies happen inside a conversation, so a message
// can never go to the wrong provider from here.
export default function RecentMessages({ onNotify }: RecentMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const openConversation = (m: Message) => {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, unread: 0 } : x)));
    // TODO: navigate to /messages/<conversationId> once the messages page exists
    onNotify(`Opening conversation with ${m.name}`);
  };

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="text-lg font-extrabold text-foreground">Recent Messages</h2>

      <ul className="mt-3 flex-1 divide-y divide-border">
        {messages.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => openConversation(m)}
              aria-label={`Open conversation with ${m.name}${m.unread ? `, ${m.unread} unread` : ''}`}
              className="flex w-full items-center gap-3 rounded-lg px-1 py-3.5 text-left transition-colors hover:bg-muted/40"
            >
              <Avatar src={m.avatar} alt={m.avatarAlt} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-foreground">{m.name}</p>
                  <span className="tabular shrink-0 text-xs text-muted-foreground">{m.time}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className={`truncate text-[13px] ${m.unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {m.preview}
                  </p>
                  {m.unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-strong px-1.5 text-[11px] font-bold text-accent-foreground">
                      {m.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
