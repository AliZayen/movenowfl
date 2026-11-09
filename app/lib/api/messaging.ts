'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorMessage, useApi } from '@/app/lib/api/client';
import type { ApiConversation } from '@/app/lib/api/types';

// Browser side of messaging. Updates arrive by polling (README 3 lists polling as the starting
// point before Pusher/Ably). Polling pauses while the tab is hidden and catches up on focus.

export const POLL_THREAD_MS = 5_000;
export const POLL_LIST_MS = 20_000;

// Fired after sending or reading, so the nav badge and Recent Messages refresh straight away
// instead of waiting for their next poll.
const CHANGED_EVENT = 'mn:messages-changed';

export function notifyMessagesChanged() {
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** Calls `refresh` every `ms` while the tab is visible, on focus, and when messages change elsewhere. */
export function usePolling(refresh: () => void, ms: number, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = window.setInterval(tick, ms);
    window.addEventListener('focus', tick);
    window.addEventListener(CHANGED_EVENT, refresh);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', tick);
      window.removeEventListener(CHANGED_EVENT, refresh);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh, ms, enabled]);
}

/** Nav badge. Pass false while signed out. */
export function useUnreadCount(enabled: boolean) {
  const { data, reload } = useApi<{ count: number }>(enabled ? '/conversations/unread-count' : null);
  usePolling(reload, POLL_LIST_MS, enabled);
  return enabled ? (data?.count ?? 0) : 0;
}

/** Conversation list, kept fresh by polling. */
export function useConversations(limit = 30) {
  const res = useApi<{ items: ApiConversation[] }>(`/conversations?limit=${limit}`);
  usePolling(res.reload, POLL_LIST_MS);
  return res;
}

/** "Message provider" on a booking → id of its conversation (created on first use). */
export async function openBookingConversation(bookingId: string) {
  const { conversation } = await api<{ conversation: ApiConversation }>('/conversations', {
    method: 'POST',
    body: { bookingId },
  });
  return conversation.id;
}

/** For "Message" buttons: opens (or creates) the booking's conversation and goes there. */
export function useMessageBooking(onError: (msg: string) => void) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const start = useCallback(
    async (bookingId: string) => {
      setBusyId(bookingId);
      try {
        router.push(`/messages/${await openBookingConversation(bookingId)}`);
      } catch (e) {
        onError(errorMessage(e));
        setBusyId(null);
      }
    },
    [router, onError],
  );
  return { start, busyId };
}

const TZ = 'America/New_York';
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });

/** List label: "10:24 AM" today, "Yesterday", "Mon" this week, then "Jun 10" / "Jun 10, 2025". */
export function shortTime(iso: string, now = new Date()) {
  const d = new Date(iso);
  const days = Math.round((Date.parse(dayKey(now)) - Date.parse(dayKey(d))) / 86_400_000);
  if (days <= 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ });
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), timeZone: TZ });
}

/** Divider label inside a thread: "Today", "Yesterday", or "Tuesday, Nov 3". */
export function dayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const days = Math.round((Date.parse(dayKey(now)) - Date.parse(dayKey(d))) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), timeZone: TZ });
}

export const messageTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ });

export { dayKey };
