'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';
import PartyAvatar from '@/app/components/ui/PartyAvatar';
import { api, errorMessage, qs, useApi } from '@/app/lib/api/client';
import { formatDate } from '@/app/lib/api/format';
import { useSession } from '@/app/components/SessionProvider';
import { dayKey, dayLabel, messageTime, notifyMessagesChanged, POLL_THREAD_MS, usePolling } from '@/app/lib/api/messaging';
import type { ApiConversation, ApiMessage } from '@/app/lib/api/types';
import { MESSAGE_MAX_LENGTH } from '@/app/lib/validation/messaging';

type UiMessage = ApiMessage & { status?: 'sending' | 'failed'; error?: string };
interface Page {
  items: ApiMessage[];
  hasMore: boolean;
}

const PAGE_SIZE = 30;
const NEAR_BOTTOM_PX = 120;
const GROUP_GAP_MS = 5 * 60_000;

/** Adds or updates messages by id (polling can return one we already have, e.g. with a new readAt). */
function merge(current: UiMessage[], incoming: ApiMessage[]) {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export default function ConversationThread({ conversationId }: { conversationId: string }) {
  const conv = useApi<{ conversation: ApiConversation }>(`/conversations/${conversationId}`);
  const [actionError, setActionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const latest = useRef<UiMessage[]>([]);
  latest.current = messages;
  // What the next render should do with the scroll position.
  const scrollIntent = useRef<{ kind: 'bottom' } | { kind: 'keep'; height: number; top: number } | null>(null);

  const base = `/conversations/${conversationId}`;

  const markRead = useCallback(async () => {
    try {
      const { marked } = await api<{ marked: number }>(`${base}/read`, { method: 'POST' });
      if (marked > 0) notifyMessagesChanged();
    } catch {
      // Not critical: the badge catches up on the next poll.
    }
  }, [base]);

  // First page, then mark the thread read.
  useEffect(() => {
    const ctrl = new AbortController();
    api<Page>(`${base}/messages${qs({ limit: PAGE_SIZE })}`, { signal: ctrl.signal }).then(
      (page) => {
        scrollIntent.current = { kind: 'bottom' };
        setMessages(page.items);
        setHasMore(page.hasMore);
        setLoaded(true);
        markRead();
      },
      (e) => {
        if (e?.name !== 'AbortError') setLoadError(errorMessage(e));
      },
    );
    return () => ctrl.abort();
  }, [base, markRead]);

  const isNearBottom = () => {
    const el = scroller.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  // Poll for anything newer than the last message we have from the server.
  const fetchNew = useCallback(async () => {
    const lastSaved = [...latest.current].reverse().find((m) => !m.status);
    try {
      const page = await api<Page>(`${base}/messages${qs({ after: lastSaved?.createdAt, limit: 100 })}`);
      const known = new Set(latest.current.map((m) => m.id));
      const fresh = page.items.filter((m) => !known.has(m.id));
      if (page.items.length === 0) return;
      if (fresh.length && isNearBottom()) scrollIntent.current = { kind: 'bottom' };
      setMessages((cur) => merge(cur, page.items));
      if (fresh.some((m) => !m.mine)) markRead();
    } catch {
      // Keep what's on screen; the next poll retries.
    }
  }, [base, markRead]);

  usePolling(fetchNew, POLL_THREAD_MS, loaded);

  const loadOlder = async () => {
    const first = messages.find((m) => !m.status);
    if (!first) return;
    setLoadingOlder(true);
    try {
      const page = await api<Page>(`${base}/messages${qs({ before: first.createdAt, limit: PAGE_SIZE })}`);
      const el = scroller.current;
      if (el) scrollIntent.current = { kind: 'keep', height: el.scrollHeight, top: el.scrollTop };
      setMessages((cur) => merge(cur, page.items));
      setHasMore(page.hasMore);
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoadingOlder(false);
    }
  };

  useLayoutEffect(() => {
    const el = scroller.current;
    const intent = scrollIntent.current;
    if (!el || !intent) return;
    scrollIntent.current = null;
    if (intent.kind === 'bottom') el.scrollTop = el.scrollHeight;
    else el.scrollTop = intent.top + (el.scrollHeight - intent.height);
  }, [messages]);

  const send = async (body: string, retryId?: string) => {
    const tempId = retryId ?? `temp-${crypto.randomUUID()}`;
    const draft: UiMessage = {
      id: tempId,
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
      hidden: false,
      automated: false,
      mine: true,
      sender: { kind: 'customer', name: 'You', moderator: false },
      status: 'sending',
    };
    scrollIntent.current = { kind: 'bottom' };
    setMessages((cur) => [...cur.filter((m) => m.id !== tempId), draft]);
    try {
      const { message } = await api<{ message: ApiMessage }>(`${base}/messages`, { method: 'POST', body: { body } });
      setMessages((cur) => merge(cur.filter((m) => m.id !== tempId), [message]));
      notifyMessagesChanged();
    } catch (e) {
      setMessages((cur) => cur.map((m) => (m.id === tempId ? { ...m, status: 'failed', error: errorMessage(e) } : m)));
    }
  };

  const c = conv.data?.conversation;
  const canModerate = !!c?.permissions.canModerate;

  // Moderator / support tools. The server checks the seat again.
  const setClosed = async (closed: boolean) => {
    setActionError(null);
    try {
      await api(base, { method: 'PATCH', body: { closed } });
      conv.reload();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };
  const hide = async (m: UiMessage) => {
    if (!window.confirm('Remove this message for everyone in the conversation?')) return;
    setActionError(null);
    try {
      const { message } = await api<{ message: ApiMessage }>(`${base}/messages/${m.id}`, { method: 'DELETE' });
      setMessages((cur) => merge(cur, [message]));
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };
  const canHide = (m: UiMessage) =>
    canModerate && !m.status && !m.hidden && (c?.seat === 'support' || m.sender.kind !== 'support');

  if (conv.error?.status === 404) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-bold text-foreground">Conversation not found</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">It may have been removed, or it belongs to another account.</p>
        <Link href="/messages" className="mt-4 text-sm font-bold text-accent-strong hover:underline">
          Back to messages
        </Link>
      </div>
    );
  }

  const lastMine = [...messages].reverse().find((m) => m.mine && !m.status);

  return (
    <>
      <ThreadHeader conversation={c} onSetClosed={setClosed} />
      {c?.closedAt && (
        <p className="border-b border-border bg-muted px-4 py-2 text-center text-xs font-semibold text-muted-foreground">
          {c.permissions.canModerate
            ? 'This conversation is closed. The customer can read it but can\u2019t reply until it is reopened.'
            : 'This conversation was closed by the moderator. Contact support if you need help.'}
        </p>
      )}
      {actionError && (
        <p role="alert" className="border-b border-border bg-destructive/10 px-4 py-2 text-center text-xs font-semibold text-destructive">
          {actionError}
        </p>
      )}

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-background/60 px-3 py-4 sm:px-5" aria-live="polite" aria-relevant="additions">
        {!loaded && !loadError && <p className="py-10 text-center text-sm text-muted-foreground">Loading messages…</p>}
        {loadError && (
          <p role="alert" className="mx-auto mb-3 max-w-sm rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {loadError}
          </p>
        )}

        {hasMore && (
          <div className="mb-3 text-center">
            <button
              type="button"
              onClick={loadOlder}
              disabled={loadingOlder}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold text-primary hover:border-accent-strong hover:text-accent-strong disabled:opacity-60"
            >
              {loadingOlder ? 'Loading…' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {loaded && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-foreground">Say hello 👋</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Ask about timing, access, parking or anything else about your booking.
            </p>
          </div>
        )}

        <ol className="space-y-1">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const newDay = !prev || dayKey(new Date(prev.createdAt)) !== dayKey(new Date(m.createdAt));
            const startOfGroup = !prev || prev.mine !== m.mine || prev.sender.name !== m.sender.name || newDay;
            const endOfGroup =
              !next ||
              next.mine !== m.mine ||
              next.sender.name !== m.sender.name ||
              Date.parse(next.createdAt) - Date.parse(m.createdAt) > GROUP_GAP_MS ||
              dayKey(new Date(next.createdAt)) !== dayKey(new Date(m.createdAt));
            return (
              <li key={m.id}>
                {newDay && (
                  <div className="my-4 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    {dayLabel(m.createdAt)}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                <Bubble
                  message={m}
                  showName={startOfGroup && !m.mine}
                  showMeta={endOfGroup}
                  seen={m.id === lastMine?.id && !!m.readAt}
                  onRetry={() => send(m.body, m.id)}
                  onHide={canHide(m) ? () => hide(m) : undefined}
                />
              </li>
            );
          })}
        </ol>
      </div>

      {c && !c.permissions.canPost ? (
        <p className="border-t border-border bg-card p-4 text-center text-sm text-muted-foreground">Replies are turned off for this conversation.</p>
      ) : (
        <Composer onSend={(body) => send(body)} disabled={!loaded} recipient={c?.otherParty.name} />
      )}
    </>
  );
}

const bookingHref = (role: string | undefined, id: string) =>
  role === 'provider' ? `/pro/jobs/${id}` : role === 'admin' ? `/admin/bookings/${id}` : `/my-bookings/${id}`;

function ThreadHeader({ conversation: c, onSetClosed }: { conversation?: ApiConversation; onSetClosed: (closed: boolean) => void }) {
  const { user } = useSession();
  const role =
    c?.otherParty.kind === 'provider'
      ? 'Your pro \u00b7 moderator'
      : c?.otherParty.kind === 'support'
        ? 'We usually reply within a few hours'
        : c?.seat === 'support' && c.moderator
          ? `Customer \u00b7 pro: ${c.moderator.name}`
          : 'Customer';
  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-3 sm:px-5">
      <Link href="/messages" aria-label="Back to all conversations" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-muted lg:hidden">
        <Icon name="ArrowLeftIcon" size={20} />
      </Link>
      {c ? (
        <>
          <PartyAvatar party={c.otherParty} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-foreground">{c.otherParty.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {role}
              {c.booking && ` · ${c.booking.serviceLabel} on ${formatDate(c.booking.scheduledDate)}`}
            </p>
          </div>
          {c.permissions.canModerate && (
            <button
              type="button"
              onClick={() => onSetClosed(!c.closedAt)}
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-bold text-primary hover:border-accent-strong hover:text-accent-strong"
            >
              {c.closedAt ? 'Reopen chat' : 'Close chat'}
            </button>
          )}
          {c.booking && (
            <Link
              href={bookingHref(user?.role, c.booking.id)}
              className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-primary hover:border-accent-strong hover:text-accent-strong sm:inline-flex"
            >
              {c.booking.ref} <Icon name="ArrowRightIcon" size={14} />
            </Link>
          )}
        </>
      ) : (
        <span className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
      )}
    </div>
  );
}

function Bubble({
  message: m,
  showName,
  showMeta,
  seen,
  onRetry,
  onHide,
}: {
  message: UiMessage;
  showName: boolean;
  showMeta: boolean;
  seen: boolean;
  onRetry: () => void;
  onHide?: () => void;
}) {
  const failed = m.status === 'failed';
  return (
    <div className={`group flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
      {/* Up to three people share a thread, so name the sender at the start of each run. */}
      {showName && (
        <span className="mb-0.5 mt-2 px-1 text-[11px] font-bold text-muted-foreground">
          {m.sender.name}
          {m.sender.moderator && <span className="ml-1 rounded bg-accent/15 px-1 py-px text-[10px] font-bold text-accent-strong">Moderator</span>}
        </span>
      )}
      <div className={`flex w-full items-center gap-1 ${m.mine ? 'flex-row-reverse' : ''}`}>
        <p
          className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed sm:max-w-[70%] ${
            m.hidden
              ? 'border border-dashed border-border bg-transparent italic text-muted-foreground'
              : m.mine
                ? `rounded-br-md bg-primary text-primary-foreground ${m.status === 'sending' ? 'opacity-70' : ''} ${failed ? 'ring-2 ring-destructive' : ''}`
                : 'rounded-bl-md border border-border bg-card text-foreground'
          }`}
        >
          {m.body}
        </p>
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            aria-label="Remove message"
            className="rounded-md p-1 text-muted-foreground opacity-60 hover:bg-muted hover:text-destructive focus:opacity-100 group-hover:opacity-100"
          >
            <Icon name="TrashIcon" size={14} />
          </button>
        )}
      </div>
      {failed ? (
        <span role="alert" className="mt-1 flex items-center gap-2 text-xs text-destructive">
          {m.error ?? 'Not sent'}
          <button type="button" onClick={onRetry} className="font-bold underline">
            Retry
          </button>
        </span>
      ) : (
        showMeta && (
          <span className="tabular mb-2 mt-1 px-1 text-[11px] text-muted-foreground">
            {m.status === 'sending' ? 'Sending…' : messageTime(m.createdAt)}
            {seen && ' · Seen'}
          </span>
        )
      )}
    </div>
  );
}

function Composer({ onSend, disabled, recipient }: { onSend: (body: string) => void; disabled: boolean; recipient?: string }) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const tooLong = text.length > MESSAGE_MAX_LENGTH;

  // Grow with the text up to ~6 lines.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const submit = () => {
    if (!trimmed || tooLong || disabled) return;
    onSend(trimmed);
    setText('');
    ref.current?.focus();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-t border-border bg-card p-3 sm:px-5"
    >
      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="sr-only">Message {recipient}</span>
          <textarea
            ref={ref}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={recipient ? `Message ${recipient}` : 'Write a message'}
            aria-invalid={tooLong || undefined}
            className="block max-h-40 min-h-11 w-full resize-none rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </label>
        <button
          type="submit"
          disabled={!trimmed || tooLong || disabled}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-strong text-accent-foreground transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="PaperAirplaneIcon" size={20} />
        </button>
      </div>
      <p className="mt-1.5 flex justify-between gap-2 px-1 text-[11px] text-muted-foreground">
        <span className="hidden sm:inline">Enter to send · Shift + Enter for a new line</span>
        {text.length > MESSAGE_MAX_LENGTH - 200 && (
          <span className={`tabular ml-auto ${tooLong ? 'font-bold text-destructive' : ''}`}>
            {text.length}/{MESSAGE_MAX_LENGTH}
          </span>
        )}
      </p>
    </form>
  );
}
