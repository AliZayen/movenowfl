'use client';

import React, { useState } from 'react';
import Avatar from '@/app/components/ui/Avatar';
import Icon from '@/app/components/ui/AppIcon';
import { initialMessages, Message } from '@/app/data/mockData';

interface RecentMessagesProps {
  onNotify: (msg: string) => void;
}

export default function RecentMessages({ onNotify }: RecentMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const markRead = (id: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, unread: 0 } : m)));

  const send = () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    // TODO: connect to messaging backend (POST /api/messages)
    setTimeout(() => {
      setMessages((prev) => {
        const [first, ...rest] = prev;
        return [{ ...first, preview: `You: ${text}`, time: 'Just now', unread: 0 }, ...rest];
      });
      setDraft('');
      setSending(false);
      onNotify('Message sent to Sarah Johnson');
    }, 500);
  };

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-foreground">Recent Messages</h2>
        <button type="button" className="text-xs font-bold text-accent hover:underline">
          View All
        </button>
      </div>

      <ul className="mt-3 flex-1 divide-y divide-border">
        {messages.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => markRead(m.id)}
              className="flex w-full items-center gap-3 py-3.5 text-left transition-colors hover:bg-muted/40"
            >
              <Avatar src={m.avatar} alt={m.avatarAlt} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-foreground">{m.name}</p>
                  <span className="tabular shrink-0 text-[11px] text-muted-foreground">{m.time}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-xs ${m.unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                  >
                    {m.preview}
                  </p>
                  {m.unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-soft"
      >
        <button
          type="button"
          aria-label="Attach file"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="PaperClipIcon" size={20} />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-label="Send message"
          className="flex h-10 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-all duration-150 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
          ) : (
            <Icon name="PaperAirplaneIcon" size={18} variant="solid" />
          )}
        </button>
      </form>
    </section>
  );
}